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

  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromURL = urlParams.get("token");
  if (tokenFromURL) {
    localStorage.setItem("jwt", tokenFromURL);
    window.history.replaceState({}, document.title, "note.html");
  }

  const jwt = localStorage.getItem("jwt");
  //console.log("JWT carregado:", jwt);

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
    currentNoteId = null;
    noteTitle.value = "";
    noteContent.value = "";
  }

  newNoteBtn.addEventListener("click", createNewNote);

  function resetNote() {
    currentNoteId = null;
    noteTitle.value = "";
    noteContent.value = "";
  }

  function loadNotes() {
    console.log("Carregando notas...");
    fetch("http://localhost:8080/api/notes", {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
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
        //console.log("Notas recebidas:", notes);
        noteList.innerHTML = "";
        if (!notes || notes.length === 0) {
          noteList.innerHTML = "<li>Nenhuma nota encontrada.</li>";
        } else {
          notes.forEach(note => {
            const li = document.createElement("li");
            li.textContent = note.title;
            li.title = note.title; // v1.0.1
            li.dataset.id = note.id;
            li.classList.add("note-item"); // v1.0.1
            li.addEventListener("click", () => {
              currentNoteId = note.id;
              noteTitle.value = note.title;
              noteContent.value = note.content;

              // Remover a classe "active" de todos os itens
              document.querySelectorAll(".note-item").forEach(item => {
                item.classList.remove("active");
              });               

              // Adicionar a classe "active" ao item clicado
              li.classList.add("active");


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

  function saveNote() {
    const note = {
      title: noteTitle.value.trim() || "Sem Título",
      content: noteContent.value.trim()
    };

    console.log("Salvando nota:", note);

    /*  if (!note.content) {
       alert("O conteúdo da nota não pode estar vazio.");
       return;
     } */

    const url = currentNoteId
      ? `http://localhost:8080/api/notes/${currentNoteId}`
      : "http://localhost:8080/api/notes";
    const method = currentNoteId ? "PUT" : "POST";

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
          if (response.status === 401) {
            alert("Sessão expirada. Faça login novamente.");
            showRedBox("Sessão expirada")
            logout();
          }
          throw new Error("Erro ao salvar nota");
        }
        return response.json();
      })
      .then(() => {
        showGreenBox("Texto salvo com sucesso!")
        loadNotes();
      })
      .catch(error => {
        console.error(error);
        showRedBox("Erro ao Salvar o texto");
      });
  }

  saveNoteBtnDesktop.addEventListener("click", saveNote);
  mobileSaveNoteBtn.addEventListener("click", saveNote);

  // v1.0.1
  // alterado para mostrar redbox ao inves do popup
  function deleteNote() {
    if (!currentNoteId) {
      showRedBox("Selecione uma nota para excluir.");
      return;
    }

    fetch(`http://localhost:8080/api/notes/${currentNoteId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    })
      .then(response => {
        if (!response.ok || response.status !== 204) {
          if (response.status === 401) {
            showRedBox("Sessão expirada. Faça login novamente.");
            logout();
          }
          throw new Error("Erro ao excluir nota");
        }
        //return response.json();
      })
      .then(() => {
        showGreenBox("Nota excluída com sucesso!");
        loadNotes();
        resetNote();
      })
      .catch(error => {
        console.error(error);
        showRedBox("Erro ao excluir nota.")
      });
  }

  deleteNoteBtnDesktop.addEventListener("click", deleteNote);
  mobileDeleteNoteBtn.addEventListener("click", deleteNote);

  const textarea = document.getElementById('noteContent');
  const lineNumbers = document.getElementById('lineNumbers');

  textarea.addEventListener('input', updateLineNumbers);
  textarea.addEventListener('scroll', () => {
    lineNumbers.scrollTop = textarea.scrollTop;
  });


  // Funcao utilizada para atualizar o numero das linhas na caixa de texto
  function updateLineNumbers() {
    const lines = textarea.value.split('\n').length;
    lineNumbers.innerHTML = '';
    for (let i = 1; i <= lines; i++) {
      const lineNumber = document.createElement('span');
      lineNumber.textContent = i;
      lineNumbers.appendChild(lineNumber);
    }
  }

  // tratamento de TAB, SHIFT+TAB e CTRL+S
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

  window.onload = () => {
    const isMobile = window.innerWidth <= 768;
    const sidebar = document.getElementById('sidebar');

    if (isMobile) {
      sidebar.classList.add('collapsed');

      const toggleBtn = document.getElementById('toggle-mobile-sidebar');
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }
  }

  // exibe uma caixa verde com a mensage de sucesso
  function showGreenBox(message) {
    let box = document.createElement("div");
    box.textContent = message;
    box.classList.add("green-box");

    document.body.appendChild(box);

    setTimeout(() => {
      box.remove();
    }, 3000); // Remove a caixa após 3 segundos
  }

  // exibe uma caixa vermelha com a mensage de erro
  function showRedBox(message) {
    let box = document.createElement("div");
    box.textContent = message;
    box.classList.add("red-box");

    document.body.appendChild(box);

    setTimeout(() => {
      box.remove();
    }, 3000); // Remove a caixa após 3 segundos
  }




  loadNotes();
  updateLineNumbers();


});