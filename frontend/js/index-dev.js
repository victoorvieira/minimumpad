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
  
  // Redireciona para OAuth Google (todos os botões de login)
  document.querySelectorAll('.login-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    });
  });

  // Botão Voltar ao Topo
  const backToTopBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // Reveal animations on scroll
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealElements.forEach(el => revealObserver.observe(el));
  
  // Funções de exibir/ocultar caixa de busca (opcional)
  function showBox() {
    const box = document.getElementById('searchBox');
    if (box) box.style.display = 'flex';
  }
  
  function closeBox() {
    const box = document.getElementById('searchBox');
    if (box) box.style.display = 'none';
  }
  