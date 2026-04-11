document.addEventListener("DOMContentLoaded", () => {
  const noteTitle            = document.getElementById("noteTitle");
  const noteContent          = document.getElementById("noteContent");
  const headerAddNoteBtn     = document.getElementById("headerAddNoteBtn");
  const sidebarAddNoteBtn    = document.getElementById("sidebarAddNoteBtn");
  const noteList             = document.getElementById("noteList");
  const sidebar              = document.getElementById("sidebar");
  const toggleSidebarBtn     = document.getElementById("toggleSidebarBtn");
  const openSidebarBtn       = document.getElementById("openSidebarBtn");
  const userIcon             = document.getElementById("userIcon");
  const lineNumbers          = document.getElementById("lineNumbers");
  const tabBar               = document.getElementById("tabBar");

  const statusLines          = document.getElementById("statusLines");
  const statusChars          = document.getElementById("statusChars");
  const statusSelection      = document.getElementById("statusSelection");

  let openTabs        = []; // Array de { id, title, content }
  let activeNoteId    = null; // ID da nota ativa (ou null para nova nota sem ID)
  let autosaveTimeout = null;
  let totalNotes      = 0;

  // --- Per-tab undo/redo history ---
  const tabHistory = {}; // { tabId: { stack: string[], index: number } }

  function getHistory(tabId) {
    if (!tabHistory[tabId]) {
      tabHistory[tabId] = { stack: [''], index: 0 };
    }
    return tabHistory[tabId];
  }

  function pushHistory(tabId, value) {
    if (!tabId) return;
    const h = getHistory(tabId);
    // Drop redo states
    h.stack = h.stack.slice(0, h.index + 1);
    // Avoid duplicate consecutive entries
    if (h.stack[h.index] === value) return;
    h.stack.push(value);
    // Keep history bounded to 200 states
    if (h.stack.length > 200) {
      h.stack.shift();
    } else {
      h.index = h.stack.length - 1;
    }
  }

  function undoHistory(tabId) {
    const h = getHistory(tabId);
    if (h.index > 0) {
      h.index--;
      return h.stack[h.index];
    }
    return null;
  }

  function redoHistory(tabId) {
    const h = getHistory(tabId);
    if (h.index < h.stack.length - 1) {
      h.index++;
      return h.stack[h.index];
    }
    return null;
  }
  // --- End undo/redo history ---

  const TITLE_MAX_LENGTH   = 100;
  const CONTENT_MAX_LENGTH = 5000;

  // JWT via URL → localStorage
  const params     = new URLSearchParams(window.location.search);
  const tokenParam = params.get("token");
  if (tokenParam) {
    localStorage.setItem("jwt", tokenParam);
    window.history.replaceState({}, document.title, "note-dev.html");
  }

  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    alert("Você não está autenticado. Faça login.");
    window.location.href = "index.html";
    return;
  }

  // Extract email
  const payload = JSON.parse(atob(jwt.split(".")[1]));
  const email   = payload.sub;

  // Collapse sidebar on mobile
  if (window.innerWidth <= 768) {
    sidebar.classList.add("collapsed");
  }

  // Sidebar toggles
  toggleSidebarBtn.addEventListener("click", () => sidebar.classList.toggle("collapsed"));
  openSidebarBtn.addEventListener("click", () => sidebar.classList.toggle("collapsed"));

  // User profile redirect
  userIcon.addEventListener("click", () => window.location.href = "profile.html");

  // CRUD bindings
  headerAddNoteBtn.addEventListener("click", createNewNote);
  if (sidebarAddNoteBtn) sidebarAddNoteBtn.addEventListener("click", createNewNote);

  // Search Notes
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll(".note-item").forEach(item => {
        if(item.classList.contains("text-gray-500")) return; // ignore 'No notes found'
        const titleSpan = item.querySelector(".note-item-title");
        if (titleSpan) {
          const text = titleSpan.textContent.toLowerCase();
          item.style.display = text.includes(term) ? "flex" : "none";
        }
      });
    });
  }

  // Title limit + autosave
  noteTitle.addEventListener("input", () => {
    if (noteTitle.value.length > TITLE_MAX_LENGTH) {
      noteTitle.value = noteTitle.value.slice(0, TITLE_MAX_LENGTH);
      showRedBox(`O título não pode ultrapassar ${TITLE_MAX_LENGTH} caracteres.`);
    }
    triggerAutosave();
  });

  // Content limit + autosave + line-numbers + push to undo history
  noteContent.addEventListener("input", () => {
    if (noteContent.value.length > CONTENT_MAX_LENGTH) {
      noteContent.value = noteContent.value.slice(0, CONTENT_MAX_LENGTH);
      showRedBox(`O conteúdo não pode ultrapassar ${CONTENT_MAX_LENGTH} caracteres.`);
    }
    // Sync current content to tab object
    const tab = openTabs.find(t => t.id === activeNoteId);
    if (tab) tab.content = noteContent.value;
    // Push state to undo history (debounced by input nature)
    pushHistory(activeNoteId, noteContent.value);
    triggerAutosave();
    updateLineNumbers();
    updateStatusBar();
  });

  // Track selection state naturally on cursor operations
  noteContent.addEventListener("keyup", updateStatusBar);
  noteContent.addEventListener("mouseup", updateStatusBar);

  // Sync scroll
  noteContent.addEventListener("scroll", () => {
    lineNumbers.scrollTop = noteContent.scrollTop;
  });

  // Tab indent/outdent, Ctrl+S, Ctrl+Z, Ctrl+Y
  noteContent.addEventListener("keydown", handleKeyDown);
  noteTitle.addEventListener("keydown", handleTabAndSave);

  // Initial load
  loadNotes();
  updateLineNumbers();

  /* — FUNCTIONS — */

  function loadNotes() {
    fetch(`http://localhost:8080/api/notes/email/${email}`, {
      headers: { Authorization: `Bearer ${jwt}` }
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            alert("Sessão expirada. Faça login novamente.");
            window.location.href = "index.html";
          }
          throw new Error("Erro ao buscar notas");
        }
        return res.json();
      })
      .then(notes => {
        totalNotes = notes.length;
        noteList.innerHTML = "";

        if (!notes.length) {
          noteList.innerHTML =
            '<li class="note-item text-gray-500">Nenhuma nota encontrada.</li>';
          if (openTabs.length === 0) {
            activeNoteId = null;
            noteTitle.value = "";
            noteContent.value = "";
            renderTabs();
            updateStatusBar();
            updateLineNumbers();
          }
          return;
        }

        notes
          .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
          .forEach(note => {
            const li = document.createElement("li");
            li.className   = "note-item";
            li.dataset.id  = note.id;
            if (note.id === activeNoteId) li.classList.add("active");

            const titleSpan = document.createElement("span");
            titleSpan.className = "note-item-title";
            titleSpan.textContent = note.title;
            titleSpan.title = note.title;
            
            const actionContainer = document.createElement("div");
            actionContainer.style.display = "flex";
            actionContainer.style.gap = "0.5rem";

            const editBtn = document.createElement("button");
            editBtn.className = "edit-icon";
            editBtn.innerHTML = "&#9998;"; // Pencil icon
            editBtn.title = "Renomear Nota";
            editBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              
              const input = document.createElement("input");
              input.className = "note-edit-input";
              input.value = note.title;
              li.replaceChild(input, titleSpan);
              input.focus();
              input.select();

              let finishing = false;
              const restore = (finalTitle) => {
                if (finishing) return;
                finishing = true;
                if (input.parentNode === li) {
                  titleSpan.textContent = finalTitle || "Sem Título";
                  titleSpan.title = finalTitle || "Sem Título";
                  li.replaceChild(titleSpan, input);
                }
              };

              const handleFinish = () => {
                if (finishing) return;
                const val = input.value.trim();
                if (val && val !== note.title) {
                  performRename(note, val, restore);
                } else {
                  restore(note.title);
                }
              };

              input.addEventListener("keydown", (ev) => {
                if (ev.key === "Enter") {
                  ev.preventDefault();
                  handleFinish();
                }
                if (ev.key === "Escape") {
                  restore(note.title);
                }
              });

              input.addEventListener("blur", handleFinish);
            });

            const downloadBtn = document.createElement("button");
            downloadBtn.className = "download-icon";
            downloadBtn.innerHTML = "&#x2913;"; // Download icon
            downloadBtn.title = "Baixar Nota (.txt)";
            downloadBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              const blob = new Blob([note.content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${note.title || 'nota'}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            });

            const delBtn = document.createElement("button");
            delBtn.className = "delete-icon";
            delBtn.innerHTML = "&times;";
            delBtn.title = "Excluir Nota";
            delBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              if(confirm("Deseja realmente excluir esta nota?")) {
                deleteNoteById(note.id);
              }
            });

            actionContainer.appendChild(editBtn);
            actionContainer.appendChild(downloadBtn);
            actionContainer.appendChild(delBtn);

            li.appendChild(titleSpan);
            li.appendChild(actionContainer);

            li.addEventListener("click", () => {
              openNoteInTab(note);
            });

            noteList.appendChild(li);
          });

        if (openTabs.length === 0) {
          activeNoteId = null;
          noteTitle.value = "";
          noteContent.value = "";
          renderTabs();
          updateStatusBar();
          updateLineNumbers();
        }
      })
      .catch(err => {
        console.error(err);
        noteList.innerHTML =
          '<li class="note-item text-gray-500">Nenhuma nota encontrada.</li>';
        if (openTabs.length === 0) {
          activeNoteId = null;
          noteTitle.value = "";
          noteContent.value = "";
          renderTabs();
          updateStatusBar();
          updateLineNumbers();
        }
      });
  }

  function performRename(note, newName, callback) {
      if (!newName || newName.trim() === "") return;
      const trimmedName = newName.trim();
      
      // Update local note object immediately
      note.title = trimmedName;
      
      // Update corresponding tab if open
      const tab = openTabs.find(t => t.id === note.id);
      if (tab) {
          tab.title = trimmedName;
          if (activeNoteId === tab.id) {
              // noteTitle is the hidden input used for saving
              if (noteTitle) noteTitle.value = trimmedName;
          }
      }
      
      // Update sidebar title immediately before server response for zero-latency feel
      if (callback) callback(trimmedName);
      
      // If it's a temp note, just save locally and update UI
      if (note.isTemp || !note.id) {
          renderTabs();
          loadNotes(); // To refresh sidebar list
          return;
      }

      // If it's a saved note, update on server
      fetch(`http://localhost:8080/api/notes/${note.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({ title: trimmedName, content: note.content })
      })
      .then(res => {
        if (!res.ok) throw new Error("Erro ao renomear nota");
        return res.json();
      })
      .then(() => {
        renderTabs();
        loadNotes(); // To refresh sidebar list order/state
        showGreenBox("Nota renomeada com sucesso!");
      })
      .catch(err => {
        console.error(err);
        showRedBox("Falha ao renomear nota.");
      });
  }

  function renameNote(note) {
    // This is still used by the tab double-click
    const newName = prompt("Digite o novo título da nota:", note.title);
    if (newName !== null && newName.trim() !== "") {
       performRename(note, newName.trim());
    }
  }

  function updateSelectedNoteUI() {
    document.querySelectorAll(".note-item").forEach(item => {
      item.classList.toggle("active", item.dataset.id == activeNoteId);
    });
    // Manually update tab active state without re-rendering all tabs
    document.querySelectorAll(".tab").forEach((tabEl, index) => {
       const tabObj = openTabs[index];
       if (tabObj) {
         tabEl.classList.toggle("active", tabObj.id == activeNoteId);
       }
    });
  }

  function openNoteInTab(note) {
    const existingTab = openTabs.find(t => t.id === note.id);
    if (existingTab) {
      switchTab(note.id);
    } else {
      openTabs.push({ ...note });
      // Initialize history for this note with its current content
      if (!tabHistory[note.id]) {
        tabHistory[note.id] = { stack: [note.content || ''], index: 0 };
      }
      renderTabs(); // Render because a new tab was added
      switchTab(note.id);
    }
    // Mobile: auto-close sidebar
    if (window.innerWidth <= 768 && sidebar) {
      sidebar.classList.add("collapsed");
    }
  }

  function renderTabs() {
    if (!tabBar) return;
    tabBar.innerHTML = "";
    
    // Toggle class for empty state
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.classList.toggle("is-empty", openTabs.length === 0);
    }

    openTabs.forEach(tab => {
      const tabEl = document.createElement("div");
      tabEl.className = "tab";
      if (tab.id === activeNoteId) tabEl.classList.add("active");
      
      const titleSpan = document.createElement("span");
      titleSpan.className = "tab-title";
      titleSpan.textContent = tab.title || "Sem Título";
      
      const closeBtn = document.createElement("span");
      closeBtn.className = "tab-close";
      closeBtn.innerHTML = "&times;";
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeTab(tab.id, e);
      });

      tabEl.appendChild(titleSpan);
      tabEl.appendChild(closeBtn);
      
      tabEl.addEventListener("click", () => switchTab(tab.id));
      tabEl.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        
        const input = document.createElement("input");
        input.className = "tab-edit-input";
        input.value = tab.title || "Sem Título";
        tabEl.replaceChild(input, titleSpan);
        input.focus();
        input.select();

        let finishing = false;
        const restore = (finalTitle) => {
          if (finishing) return;
          finishing = true;
          if (input.parentNode === tabEl) {
            titleSpan.textContent = finalTitle || "Sem Título";
            tabEl.replaceChild(titleSpan, input);
          }
        };

        const finish = () => {
          if (finishing) return;
          const val = input.value.trim();
          if (val && val !== tab.title) {
            performRename(tab, val, restore);
          } else {
            restore(tab.title);
          }
        };

        input.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
             ev.preventDefault();
             finish();
          }
          if (ev.key === "Escape") restore(tab.title);
        });

        input.addEventListener("blur", finish);
      });
      tabBar.appendChild(tabEl);
    });
  }

  function switchTab(noteId) {
    activeNoteId = noteId;
    const tab = openTabs.find(t => t.id === noteId);
    if (tab) {
      noteTitle.value = tab.title || "";
      noteContent.value = tab.content || "";
      // Ensure history is seeded for this tab
      if (!tabHistory[noteId]) {
        tabHistory[noteId] = { stack: [tab.content || ''], index: 0 };
      }
      updateSelectedNoteUI();
      updateLineNumbers();
      updateStatusBar();
    }
  }

  function closeTab(noteId, event) {
    const tabIndex = openTabs.findIndex(t => t.id === noteId);
    if (tabIndex === -1) return;

    openTabs.splice(tabIndex, 1);
    // Clean up history for closed tab
    delete tabHistory[noteId];
    
    if (activeNoteId === noteId) {
      if (openTabs.length > 0) {
        const nextTab = openTabs[tabIndex] || openTabs[tabIndex - 1];
        switchTab(nextTab.id);
      } else {
        // No tabs left: Show empty state instead of creating a new note
        activeNoteId = null;
        noteTitle.value = "";
        noteContent.value = "";
        updateSelectedNoteUI();
        updateStatusBar();
        updateLineNumbers();
      }
    }
    // Always render tabs after closing one to reflect changes immediately
    renderTabs();
  }

  function createNewNote() {
    if (totalNotes >= 100) {
      showRedBox("Você atingiu o limite de 100 notas.");
      return;
    }
    
    const newNoteTemplate = {
      id: "temp-" + Date.now(),
      title: "",
      content: "",
      isTemp: true
    };
    
    openTabs.push(newNoteTemplate);
    // Seed empty history for new note
    tabHistory[newNoteTemplate.id] = { stack: [''], index: 0 };
    renderTabs();
    switchTab(newNoteTemplate.id);
  }

  function saveNote() {
    const title   = noteTitle.value.trim() || "Sem Título";
    const content = noteContent.value.trim();

    if (title.length > TITLE_MAX_LENGTH) {
      showRedBox(`O título não pode ultrapassar ${TITLE_MAX_LENGTH} caracteres.`);
      return;
    }
    if (content.length > CONTENT_MAX_LENGTH) {
      showRedBox(`O conteúdo não pode ultrapassar ${CONTENT_MAX_LENGTH} caracteres.`);
      return;
    }

    const currentTab = openTabs.find(t => t.id === activeNoteId);
    if (!currentTab) return;

    const isNew = currentTab.isTemp;
    const url = isNew
      ? "http://localhost:8080/api/notes"
      : `http://localhost:8080/api/notes/${activeNoteId}`;
    const method = isNew ? "POST" : "PUT";

    fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`
      },
      body: JSON.stringify({ title, content })
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 400) showRedBox("Limite de 100 notas atingido.");
          if (res.status === 401) {
            showRedBox("Sessão expirada. Faça login novamente.");
            window.location.href = "index.html";
          }
          throw new Error("Erro ao salvar nota");
        }
        return res.json();
      })
      .then(data => {
        if (isNew && data.id) {
          // Migrate undo history to the real ID
          if (tabHistory[currentTab.id]) {
            tabHistory[data.id] = tabHistory[currentTab.id];
            delete tabHistory[currentTab.id];
          }
          currentTab.id = data.id;
          currentTab.isTemp = false;
          activeNoteId = data.id;
        }
        currentTab.title = title;
        currentTab.content = content;
        
        showGreenBox("Texto salvo com sucesso!");
        loadNotes();
        renderTabs();
      })
      .catch(err => {
        console.error(err);
        showRedBox("Erro ao salvar o texto.");
      });
  }

  function deleteNote() {
    if (!activeNoteId) {
      showRedBox("Selecione uma nota para excluir.");
      return;
    }
    const currentTab = openTabs.find(t => t.id === activeNoteId);
    if (currentTab && currentTab.isTemp) {
        closeTab(activeNoteId);
        return;
    }
    if (confirm("Deseja realmente excluir a nota atual?")) {
      deleteNoteById(activeNoteId);
    }
  }

  function deleteNoteById(id) {
    if (!id) return;
    fetch(`http://localhost:8080/api/notes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Erro ao excluir nota");
      })
      .then(() => {
        showGreenBox("Nota excluída com sucesso!");
        closeTab(id);
        loadNotes();
      })
      .catch(err => {
        console.error(err);
        showRedBox("Erro ao excluir nota.");
      });
  }

  function triggerAutosave() {
    clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(() => {
      if (noteTitle.value || noteContent.value) {
        saveNote();
      }
    }, 2000);
  }

  function updateLineNumbers() {
    const style      = getComputedStyle(noteContent);
    let lineHeight   = parseFloat(style.lineHeight);
    if (isNaN(lineHeight)) {
      lineHeight = parseFloat(style.fontSize) * 1.2;
    }
    const totalLines = Math.ceil(noteContent.scrollHeight / lineHeight);

    lineNumbers.innerHTML = "";
    for (let i = 1; i <= totalLines; i++) {
      const span = document.createElement("span");
      span.textContent = i;
      lineNumbers.appendChild(span);
    }
  }

  function updateStatusBar() {
    const text = noteContent.value;
    const chars = text.length;
    const lines = text.length === 0 ? 0 : text.split('\n').length;
    
    // Selection state bindings
    const start = noteContent.selectionStart || 0;
    const end = noteContent.selectionEnd || 0;
    const selectedLen = end - start;
    
    if (statusLines) statusLines.textContent = `${lines} ${lines === 1 ? 'linha' : 'linhas'}`;
    if (statusChars) {
      statusChars.textContent = `${chars} / 5000 ${chars === 1 ? 'caractere' : 'caracteres'}`;
      statusChars.classList.toggle("status-warning", chars >= 5000);
    }
    
    if (statusSelection) {
      if (selectedLen > 0) {
        statusSelection.textContent = `(${selectedLen} ${selectedLen === 1 ? 'selecionado' : 'selecionados'})`;
      } else {
        statusSelection.textContent = "";
      }
    }
  }

  function handleKeyDown(event) {
    // CTRL+Z — Undo
    if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (!activeNoteId) return;
      const prev = undoHistory(activeNoteId);
      if (prev !== null) {
        const cursor = noteContent.selectionStart;
        noteContent.value = prev;
        // Restore cursor as close as possible
        noteContent.selectionStart = noteContent.selectionEnd = Math.min(cursor, prev.length);
        const tab = openTabs.find(t => t.id === activeNoteId);
        if (tab) tab.content = prev;
        triggerAutosave();
        updateLineNumbers();
        updateStatusBar();
      }
      return;
    }

    // CTRL+Y or CTRL+SHIFT+Z — Redo
    if (event.ctrlKey && (event.key.toLowerCase() === "y" || (event.shiftKey && event.key.toLowerCase() === "z"))) {
      event.preventDefault();
      if (!activeNoteId) return;
      const next = redoHistory(activeNoteId);
      if (next !== null) {
        const cursor = noteContent.selectionStart;
        noteContent.value = next;
        noteContent.selectionStart = noteContent.selectionEnd = Math.min(cursor, next.length);
        const tab = openTabs.find(t => t.id === activeNoteId);
        if (tab) tab.content = next;
        triggerAutosave();
        updateLineNumbers();
        updateStatusBar();
      }
      return;
    }

    // Tab indent/outdent
    if (event.key === "Tab") {
      event.preventDefault();
      const start = noteContent.selectionStart;
      const end   = noteContent.selectionEnd;
      if (event.shiftKey) {
        if (noteContent.value.substring(0, start).endsWith("\t")) {
          noteContent.value =
            noteContent.value.substring(0, start - 1) +
            noteContent.value.substring(end);
          noteContent.selectionStart = noteContent.selectionEnd = start - 1;
        }
      } else {
        noteContent.value =
          noteContent.value.substring(0, start) +
          "\t" +
          noteContent.value.substring(end);
        noteContent.selectionStart = noteContent.selectionEnd = start + 1;
      }
      pushHistory(activeNoteId, noteContent.value);
      const tab = openTabs.find(t => t.id === activeNoteId);
      if (tab) tab.content = noteContent.value;
      updateLineNumbers();
      return;
    }

    // CTRL+S — Save
    if (event.ctrlKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveNote();
    }
  }

  function handleTabAndSave(event) {
    if (event.ctrlKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveNote();
    }
  }

  function showGreenBox(msg) {
    const box = document.createElement("div");
    box.title = msg;
    box.classList.add("save-success-circle");
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2000);
  }

  function showRedBox(msg) {
    const box = document.createElement("div");
    box.textContent = msg;
    box.classList.add(
      "fixed", "top-4", "right-4",
      "bg-red-600", "text-white",
      "px-4", "py-2",
      "rounded", "shadow-lg",
      "z-50"
    );
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3000);
  }
});
