// Cria nota pública (modo anônimo)
const createNoteBtn = document.getElementById('createNoteBtn');
if (createNoteBtn) {
  createNoteBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('https://minimumpad.com/tomcat/api/publicnotes', { method: 'POST' });
      const { url } = await res.json();
      window.location.href = `public-note.html?note=${url}`;
    } catch (err) {
      console.error(err);
      alert('Falha ao criar nota pública.');
    }
  });
}

// Redireciona para OAuth Google (todos os botões de login)
// Usamos event delegation ou garantimos que o listener seja portável
function handleLogin() {
  window.location.href = 'https://minimumpad.com/oauth2/authorization/google';
}

document.querySelectorAll('.login-btn').forEach(btn => {
  btn.addEventListener('click', handleLogin);
});

// Botão Voltar ao Topo
const backToTopBtn = document.getElementById('backToTop');
if (backToTopBtn) {
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
}

// Reveal animations on scroll
const revealElements = document.querySelectorAll('.reveal');
if (revealElements.length > 0) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { 
    threshold: 0.1, // Mais sensível
    rootMargin: '0px 0px -50px 0px' // Começa animação um pouco antes de entrar
  });

  revealElements.forEach(el => revealObserver.observe(el));
}

// Funções de exibir/ocultar caixa de busca (opcional)
window.showBox = function() {
  const box = document.getElementById('searchBox');
  if (box) box.style.display = 'flex';
}

window.closeBox = function() {
  const box = document.getElementById('searchBox');
  if (box) box.style.display = 'none';
}