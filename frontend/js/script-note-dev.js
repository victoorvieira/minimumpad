document.addEventListener("DOMContentLoaded", () => {
  const noteTitle            = document.getElementById("noteTitle");
  const noteContent          = document.getElementById("noteContent");
  const newNoteBtn           = document.getElementById("newNoteBtn");
  const saveNoteBtnDesktop   = document.getElementById("saveNoteBtnDesktop");
  const deleteNoteBtnDesktop = document.getElementById("deleteNoteBtnDesktop");
  const noteList             = document.getElementById("noteList");
  const sidebar              = document.getElementById("sidebar");
  const toggleSidebarBtn     = document.getElementById("toggleSidebarBtn");
  const openSidebarBtn       = document.getElementById("openSidebarBtn");
  const userIcon             = document.getElementById("userIcon");
  const userMenu             = document.getElementById("userMenu");
  const profileBtn           = document.getElementById("profileBtn");
  const lineNumbers          = document.getElementById("lineNumbers");

  let currentNoteId   = null;
  let autosaveTimeout = null;
  let totalNotes      = 0;

  const TITLE_MAX_LENGTH   = 100;
  const CONTENT_MAX_LENGTH = 5000;

  // 1) JWT token via URL → localStorage
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

  // 2) Extract email from token
  const payload = JSON.parse(atob(jwt.split(".")[1]));
  const email   = payload.sub;

  // 3) Collapse sidebar on mobile
  if (window.innerWidth <= 768) {
    sidebar.classList.add("collapsed");
  }

  // 4) Toggle sidebar
  toggleSidebarBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });
  openSidebarBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  // 5) User-menu open/close and outside click
  userIcon.addEventListener("click", e => {
    e.stopPropagation();
    userMenu.classList.toggle("visible");
  });
  document.addEventListener("click", e => {
    if (!userMenu.contains(e.target) && !userIcon.contains(e.target)) {
      userMenu.classList.remove("visible");
    }
  });
  profileBtn.addEventListener("click", () => {
    window.location.href = "profile.html";
  });

  // 6) CRUD bindings
  newNoteBtn.addEventListener("click", createNewNote);
  saveNoteBtnDesktop.addEventListener("click", saveNote);
  deleteNoteBtnDesktop.addEventListener("click", deleteNote);

  // 7) Title input: max 100 chars + autosave
  noteTitle.addEventListener("input", () => {
    if (noteTitle.value.length > TITLE_MAX_LENGTH) {
      noteTitle.value = noteTitle.value.slice(0, TITLE_MAX_LENGTH);
      showRedBox(`O título não pode ultrapassar ${TITLE_MAX_LENGTH} caracteres.`);
    }
    triggerAutosave();
  });

  // 8) Content input: max 5000 chars + autosave + line-nums
  noteContent.addEventListener("input", () => {
    if (noteContent.value.length > CONTENT_MAX_LENGTH) {
      noteContent.value = noteContent.value.slice(0, CONTENT_MAX_LENGTH);
      showRedBox(`O conteúdo não pode ultrapassar ${CONTENT_MAX_LENGTH} caracteres.`);
    }
    triggerAutosave();
    updateLineNumbers();
  });

  // 9) Scroll sync
  noteContent.addEventListener("scroll", () => {
    lineNumbers.scrollTop = noteContent.scrollTop;
  });

  // 10) Tab indent/outdent + Ctrl+S
  noteContent.addEventListener("keydown", handleTabAndSave);
  noteTitle.addEventListener("keydown", handleTabAndSave);

  // 11) Initial load
  loadNotes();
  updateLineNumbers();

  /* ——— FUNCTIONS ——— */

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
          return;
        }

        notes
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .forEach(note => {
            const li = document.createElement("li");
            li.className   = "note-item";
            li.textContent = note.title;
            li.title       = note.title;
            li.dataset.id  = note.id;
            if (note.id === currentNoteId) li.classList.add("active");

            li.addEventListener("click", () => {
              currentNoteId     = note.id;
              noteTitle.value   = note.title;
              noteContent.value = note.content;
              updateSelectedNoteUI();
              updateLineNumbers();
            });

            noteList.appendChild(li);
          });
      })
      .catch(err => {
        console.error(err);
        noteList.innerHTML =
          '<li class="note-item text-gray-500">Nenhuma nota encontrada.</li>';
      });
  }

  function updateSelectedNoteUI() {
    document.querySelectorAll(".note-item").forEach(item => {
      item.classList.toggle("active", item.dataset.id == currentNoteId);
    });
  }

  function createNewNote() {
    if (totalNotes >= 100) {
      showRedBox("Você atingiu o limite de 100 notas.");
      return;
    }
    currentNoteId     = null;
    noteTitle.value   = "";
    noteContent.value = "";
    updateSelectedNoteUI();
    updateLineNumbers();
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

    const isNew  = !currentNoteId;
    const url    = isNew
      ? "http://localhost:8080/api/notes"
      : `http://localhost:8080/api/notes/${currentNoteId}`;
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
        if (isNew && data.id) currentNoteId = data.id;
        showGreenBox("Texto salvo com sucesso!");
        loadNotes();
      })
      .catch(err => {
        console.error(err);
        showRedBox("Erro ao salvar o texto.");
      });
  }

  function deleteNote() {
    if (!currentNoteId) {
      showRedBox("Selecione uma nota para excluir.");
      return;
    }
    fetch(`http://localhost:8080/api/notes/${currentNoteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Erro ao excluir nota");
      })
      .then(() => {
        showGreenBox("Nota excluída com sucesso!");
        loadNotes();
        createNewNote();
      })
      .catch(err => {
        console.error(err);
        showRedBox("Erro ao excluir nota.");
      });
  }

  function triggerAutosave() {
    clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(() => {
      if (noteTitle.value || noteContent.value || currentNoteId) {
        saveNote();
      }
    }, 2000);
  }

  function updateLineNumbers() {
    const lines = noteContent.value.split("\n").length;
    lineNumbers.innerHTML = "";
    for (let i = 1; i <= lines; i++) {
      const span = document.createElement("span");
      span.textContent = i;
      lineNumbers.appendChild(span);
    }
  }

  function handleTabAndSave(event) {
    // Tab indent/outdent
    if (event.key === "Tab") {
      event.preventDefault();
      const start = this.selectionStart;
      const end   = this.selectionEnd;
      if (event.shiftKey) {
        if (this.value.substring(0, start).endsWith("\t")) {
          this.value =
            this.value.substring(0, start - 1) +
            this.value.substring(end);
          this.selectionStart = this.selectionEnd = start - 1;
        }
      } else {
        this.value =
          this.value.substring(0, start) +
          "\t" +
          this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 1;
      }
    }
    // Ctrl+S
    if (event.ctrlKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveNote();
    }
  }

  function showGreenBox(msg) {
    const box = document.createElement("div");
    box.textContent = msg;
    box.classList.add("green-box");
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3000);
  }

  function showRedBox(msg) {
    const box = document.createElement("div");
    box.textContent = msg;
    box.classList.add("red-box");
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3000);
  }
});