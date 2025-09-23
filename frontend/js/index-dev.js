// Cria nota pública (modo anônimo)
document.getElementById('createNoteBtn').addEventListener('click', async () => {
    try {
      const res = await fetch('http://localhost:8080/api/publicnotes', { method: 'POST' });
      const { url } = await res.json();
      window.location.href = `public-note.html?note=${url}`;
    } catch (err) {
      console.error(err);
      alert('Falha ao criar nota pública.');
    }
  });
  
  // Redireciona para OAuth Google
  document.getElementById('loginBtn').addEventListener('click', () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  });
  
  // Funções de exibir/ocultar caixa de busca (opcional)
  function showBox() {
    const box = document.getElementById('searchBox');
    if (box) box.style.display = 'flex';
  }
  
  function closeBox() {
    const box = document.getElementById('searchBox');
    if (box) box.style.display = 'none';
  }
  