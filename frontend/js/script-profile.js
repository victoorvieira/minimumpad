document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("jwt");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const payload = JSON.parse(atob(token.split(".")[1]));
  const email = payload.sub;

  const userApiUrl = `https://minimumpad.com/tomcat/api/users/email/${email}`;
  const notesApiUrl = `https://minimumpad.com/tomcat/api/notes/email/${email}`;
  const userDelUrl = `https://minimumpad.com/tomcat/api/users/me`;

  // Buscar informações do usuário
  fetch(userApiUrl, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
      return res.json();
    })
    .then(user => {
      console.log("User carregado:", user); // 👈 DEBUG

      const name =
        user.name || user.fullName || user.username || "No name";

      const fullNameEl = document.getElementById("full-name");
      if (fullNameEl) fullNameEl.textContent = name;

      const emailEl = document.getElementById("email");
      if (emailEl) emailEl.textContent = user.email || email;

      const userNameEl = document.getElementById("user-name");
      if (userNameEl) userNameEl.textContent = name;

      const locationEl = document.querySelector(".location");
      if (locationEl) locationEl.textContent = user.location || "";
    })
    .catch(err => {
      console.error("Erro ao carregar usuário:", err);
      const fullNameEl = document.getElementById("full-name");
      if (fullNameEl) fullNameEl.textContent = "Erro ao carregar";
    });

  // Buscar contagem de notas
  fetch(notesApiUrl, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
      return res.json();
    })
    .then(notes => {
      console.log("Notas carregadas:", notes); // 👈 DEBUG

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
      if (notesCountEl) notesCountEl.textContent = "Erro";
    });

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
  function logout() {
    localStorage.removeItem("jwt");
    window.location.href = "index.html";
  }
  if (logoutBtnProfile) logoutBtnProfile.addEventListener("click", logout);
});
