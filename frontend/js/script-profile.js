document.addEventListener("DOMContentLoaded", () => {
  const sidebar          = document.getElementById("sidebar");
  const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
  const openSidebarBtn   = document.getElementById("openSidebarBtn");
  const userIcon         = document.getElementById("userIcon");

  const token = localStorage.getItem("jwt");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const payload = JSON.parse(atob(token.split(".")[1]));
  const email = payload.sub;

  // Local API Base URL (consistent with editor)
  const API_BASE = "http://localhost:8080/api";
  const userApiUrl = `${API_BASE}/users/email/${email}`;
  const notesApiUrl = `${API_BASE}/notes/email/${email}`;
  const userDelUrl = `${API_BASE}/users/me`;

  // Sidebar Toggles
  if (toggleSidebarBtn) toggleSidebarBtn.addEventListener("click", () => sidebar.classList.toggle("collapsed"));
  if (openSidebarBtn) openSidebarBtn.addEventListener("click", () => sidebar.classList.toggle("collapsed"));
  if (userIcon) userIcon.addEventListener("click", () => {
      // Already on profile page, maybe just scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Collapse sidebar on small screens
  if (window.innerWidth <= 768 && sidebar) {
    sidebar.classList.add("collapsed");
  }

  // Buscar informações do usuário
  fetch(userApiUrl, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
      return res.json();
    })
    .then(user => {
      const name = user.name || user.fullName || user.username || email.split('@')[0];
      
      const userNameEl = document.getElementById("user-name");
      if (userNameEl) userNameEl.textContent = name;

      const emailEl = document.getElementById("email");
      if (emailEl) emailEl.textContent = user.email || email;
    })
    .catch(err => {
      console.error("Erro ao carregar usuário:", err);
      const userNameEl = document.getElementById("user-name");
      if (userNameEl) userNameEl.textContent = "Erro ao carregar";
    });

  // Buscar contagem de notas
  let allNotes = []; // To store for ZIP export
  fetch(notesApiUrl, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
      return res.json();
    })
    .then(notes => {
      allNotes = notes;
      const count = notes.length || 0;

      // Atualizar contador de notas
      const notesCountEl = document.getElementById("notes-count");
      if (notesCountEl) notesCountEl.textContent = count;

      // Atualizar barra de progresso (até 100)
      const progress = Math.min((count / 100) * 100, 100);
      const progressBar = document.getElementById("notes-progress");
      if (progressBar) progressBar.style.width = progress + "%";
    })
    .catch(err => {
      console.error("Erro ao carregar notas:", err);
      const notesCountEl = document.getElementById("notes-count");
      if (notesCountEl) notesCountEl.textContent = "!";
    });

  // Download All as ZIP
  const downloadAllNotesBtn = document.getElementById("downloadAllNotesBtn");
  if (downloadAllNotesBtn) {
    downloadAllNotesBtn.addEventListener("click", async () => {
      if (allNotes.length === 0) {
        alert("Você não possui notas para baixar.");
        return;
      }

      try {
        const zip = new JSZip();
        allNotes.forEach((note, index) => {
          const fileName = `${note.title || `Nota_${index + 1}`}.txt`;
          zip.file(fileName, note.content || "");
        });

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Minimumpad_Notas_${new Date().toISOString().split('T')[0]}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Erro ao gerar ZIP:", error);
        alert("Ocorreu um erro ao gerar o arquivo ZIP.");
      }
    });
  }

  // Excluir conta
  const deleteBtn = document.getElementById("delete-account");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      if (
        confirm(
          "Você tem certeza que deseja excluir sua conta? \n\nEsta ação não poderá ser desfeita."
        )
      ) {
        fetch(userDelUrl, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => {
            if (res.ok) {
              alert("Conta excluída com sucesso.");
              localStorage.removeItem("jwt");
              window.location.href = "index.html";
            } else {
              alert("Falha ao excluir a conta.");
            }
          })
          .catch(err => console.error("Erro ao excluir conta:", err));
      }
    });
  }

  // Logout
  const logoutBtnProfile = document.getElementById("logoutBtnProfile");
  if (logoutBtnProfile) {
    logoutBtnProfile.addEventListener("click", () => {
        localStorage.removeItem("jwt");
        window.location.href = "index.html";
    });
  }
});
