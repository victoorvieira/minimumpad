document.addEventListener("DOMContentLoaded", function () {
  const noteTitle = document.getElementById("noteTitle");
  const noteContent = document.getElementById("noteContent");
  const newNoteBtn = document.getElementById("newNoteBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const noteList = document.getElementById("noteList");
  const sidebar = document.getElementById("sidebar");
  const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
  const mobileFooterBtn = document.getElementById("mobileFooterBtn");
  const openSidebarBtn = document.getElementById("openSidebarBtn");
  const userMenu = document.getElementById("userMenu");
  const saveNoteBtnDesktop = document.getElementById("saveNoteBtnDesktop");
  const deleteNoteBtnDesktop = document.getElementById("deleteNoteBtnDesktop");
  const mobileSaveNoteBtn = document.getElementById("mobileSaveNoteBtn");
  const mobileDeleteNoteBtn = document.getElementById("mobileDeleteNoteBtn");

  let currentNoteId = null;
  let autosaveTimeout = null;
  let totalNotes = 0;

  const TITLE_MAX_LENGTH = 100;
  const CONTENT_MAX_LENGTH = 5000;

  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromURL = urlParams.get("token");
  if (tokenFromURL) {
    localStorage.setItem("jwt", tokenFromURL);
    window.history.replaceState({}, document.title, "note.html");
  }

  const jwt = localStorage.getItem("jwt");

  if (!jwt) {
    alert("Você não está autenticado. Faça login.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userIcon").addEventListener("click", () => {
    userMenu.classList.toggle("visible");
  });

  document.getElementById("userIconMobile").addEventListener("click", () => {
    userMenu.classList.toggle("visible");
  });

  function logout() {
    localStorage.removeItem("jwt");
    window.location.href = "index.html";
  }

  logoutBtn.addEventListener("click", logout);

  toggleSidebarBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  openSidebarBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  mobileFooterBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  function createNewNote() {
    if (totalNotes >= 100) {
      showRedBox("Você atingiu o limite de 100 notas.");
      return;
    }

    currentNoteId = null;
    noteTitle.value = "";
    noteContent.value = "";
    updateSelectedNoteUI();
  }

  newNoteBtn.addEventListener("click", createNewNote);

  function resetNote() {
    currentNoteId = null;
    noteTitle.value = "";
    noteContent.value = "";
    updateSelectedNoteUI();
  }

  function loadNotes() {
    fetch("http://localhost:8080/api/notes", {
      headers: { Authorization: `Bearer ${jwt}` }
    })
      .then(response => {
        if (!response.ok) {
          if (response.status === 401) {
            alert("Sessão expirada. Faça login novamente.");
            logout();
          }
          throw new Error("Nenhuma nota encontrada");
        }
        return response.json();
      })
      .then(notes => {
        totalNotes = notes.length;
        noteList.innerHTML = "";

        if (!notes || notes.length === 0) {
          noteList.innerHTML = "<li>Nenhuma nota encontrada.</li>";
        } else {
          notes.sort((a, b) => {
            const aDate = new Date(a.createdAt || 0);
            const bDate = new Date(b.createdAt || 0);
            return bDate - aDate;
          });

          notes.forEach(note => {
            const li = document.createElement("li");
            li.textContent = note.title;
            li.title = note.title;
            li.dataset.id = note.id;
            li.classList.add("note-item");

            if (note.id === currentNoteId) li.classList.add("active");

            li.addEventListener("click", () => {
              currentNoteId = note.id;
              noteTitle.value = note.title;
              noteContent.value = note.content;
              updateSelectedNoteUI();
            });

            noteList.appendChild(li);
          });
        }
      })
      .catch(error => {
        console.error(error);
        noteList.innerHTML = "<li>Nenhuma nota encontrada.</li>";
      });
  }

  function updateSelectedNoteUI() {
    document.querySelectorAll(".note-item").forEach(item => {
      item.classList.toggle("active", item.dataset.id === currentNoteId);
    });
  }

  function saveNote() {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();

    if (title.length > TITLE_MAX_LENGTH) {
      showRedBox(`O título não pode ultrapassar ${TITLE_MAX_LENGTH} caracteres.`);
      return;
    }

    if (content.length > CONTENT_MAX_LENGTH) {
      showRedBox(`O conteúdo não pode ultrapassar ${CONTENT_MAX_LENGTH} caracteres.`);
      return;
    }

    const note = {
      title: title || "Sem Título",
      content: content
    };

    const isNewNote = !currentNoteId;
    const url = isNewNote
      ? "http://localhost:8080/api/notes"
      : `http://localhost:8080/api/notes/${currentNoteId}`;
    const method = isNewNote ? "POST" : "PUT";

    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`
      },
      body: JSON.stringify(note)
    })
      .then(response => {
        if (!response.ok) {
          if (response.status === 400) {
            showRedBox("Você atingiu o limite de 100 notas.");
            throw new Error("Limite de notas atingido");
          }
          if (response.status === 401) {
            showRedBox("Sessão expirada. Faça login novamente.");
            logout();
          }
          throw new Error("Erro ao salvar nota");
        }
        return response.json();
      })
      .then(savedNote => {
        if (isNewNote && savedNote?.id) {
          currentNoteId = savedNote.id;
        }
        showGreenBox("Texto salvo com sucesso!");
        loadNotes();
      })
      .catch(error => {
        console.error(error);
        showRedBox("Erro ao salvar o texto.");
      });
  }

  function triggerAutosave() {
    clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(() => {
      if (noteTitle.value.trim() || noteContent.value.trim() || currentNoteId) {
        saveNote();
      }
    }, 2000);
  }

  noteTitle.addEventListener("input", triggerAutosave);
  noteContent.addEventListener("input", triggerAutosave);

  saveNoteBtnDesktop.addEventListener("click", saveNote);
  mobileSaveNoteBtn.addEventListener("click", saveNote);

  function deleteNote() {
    if (!currentNoteId) {
      showRedBox("Selecione uma nota para excluir.");
      return;
    }

    fetch(`http://localhost:8080/api/notes/${currentNoteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` }
    })
      .then(response => {
        if (!response.ok || response.status !== 204) {
          if (response.status === 401) {
            showRedBox("Sessão expirada. Faça login novamente.");
            logout();
          }
          throw new Error("Erro ao excluir nota");
        }
      })
      .then(() => {
        showGreenBox("Nota excluída com sucesso!");
        loadNotes();
        resetNote();
      })
      .catch(error => {
        console.error(error);
        showRedBox("Erro ao excluir nota.");
      });
  }

  deleteNoteBtnDesktop.addEventListener("click", deleteNote);
  mobileDeleteNoteBtn.addEventListener("click", deleteNote);

  const textarea = document.getElementById("noteContent");
  const lineNumbers = document.getElementById("lineNumbers");

  textarea.addEventListener("input", updateLineNumbers);
  textarea.addEventListener("scroll", () => {
    lineNumbers.scrollTop = textarea.scrollTop;
  });

  function updateLineNumbers() {
    const lines = textarea.value.split("\n").length;
    lineNumbers.innerHTML = "";
    for (let i = 1; i <= lines; i++) {
      const lineNumber = document.createElement("span");
      lineNumber.textContent = i;
      lineNumbers.appendChild(lineNumber);
    }
  }

  textarea.addEventListener("keydown", function (event) {
    if (event.key === "Tab") {
      event.preventDefault();
      const start = this.selectionStart;
      const end = this.selectionEnd;

      if (event.shiftKey) {
        const text = this.value;
        const before = text.substring(0, start);
        const after = text.substring(end);
        if (before.endsWith("\t")) {
          this.value = before.slice(0, -1) + after;
          this.selectionStart = this.selectionEnd = start - 1;
        }
      } else {
        this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 1;
      }
    }

    if (event.ctrlKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveNote();
    }
  });

  noteTitle.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveNote();
    }
  });

  window.onload = () => {
    const isMobile = window.innerWidth <= 768;
    const sidebar = document.getElementById("sidebar");

    if (isMobile) {
      sidebar.classList.add("collapsed");

      const toggleBtn = document.getElementById("toggle-mobile-sidebar");
      toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
      });
    }
  };

  function showGreenBox(message) {
    let box = document.createElement("div");
    box.textContent = message;
    box.classList.add("green-box");
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3000);
  }

  function showRedBox(message) {
    let box = document.createElement("div");
    box.textContent = message;
    box.classList.add("red-box");
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3000);
  }

  loadNotes();
  updateLineNumbers();
});
