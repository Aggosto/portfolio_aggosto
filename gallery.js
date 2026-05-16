document.addEventListener('DOMContentLoaded', function(){
  const placeholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="%23000"/><text x="50%" y="50%" fill="%23fff" font-size="20" font-family="Arial" text-anchor="middle" dominant-baseline="middle">Imagen no encontrada</text></svg>';
  const missing = new Set();

  // Replace broken images with a placeholder and collect missing paths
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', ()=>{
      if(img.dataset._orig) return;
      img.dataset._orig = img.src;
      missing.add(img.dataset._orig);
      img.src = placeholder;
      img.classList.add('missing');
    });
  });
  // Toggle project open/close
  document.querySelectorAll('.project-header').forEach(header=>{
    header.addEventListener('click', ()=>{
      const project = header.parentElement;
      const body = project.querySelector('.project-body');
      const opened = project.classList.contains('open');
      project.classList.toggle('open', !opened);
      header.setAttribute('aria-expanded', String(!opened));
      body.setAttribute('aria-hidden', String(opened));
      if(!opened){
        const track = project.querySelector('.carousel-track');
        track && track.scrollTo({left:0, behavior:'smooth'});
      }
    });
  });

  // Carousel navigation
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const carousel = btn.closest('.carousel');
      const track = carousel.querySelector('.carousel-track');
      const item = track.querySelector('.carousel-item');
      const gap = parseInt(getComputedStyle(track).gap) || 18;
      const itemWidth = item ? item.offsetWidth + gap : 300;
      const dir = btn.classList.contains('next') ? 1 : -1;
      track.scrollBy({left: dir * itemWidth * 1.2, behavior:'smooth'});
    });
  });

  // Make carousel keyboard-focusable and add basic arrow support
  document.querySelectorAll('.carousel-track').forEach(track=>{
    track.setAttribute('tabindex','0');
    track.addEventListener('keydown', (e)=>{
      if(e.key === 'ArrowRight') track.scrollBy({left: 300, behavior:'smooth'});
      if(e.key === 'ArrowLeft') track.scrollBy({left: -300, behavior:'smooth'});
    });
  });

  // After a short delay, if there are missing images, show a console summary and a page banner
  setTimeout(()=>{
    if(missing.size){
      console.warn('Imágenes faltantes detectadas:', Array.from(missing));
      const banner = document.createElement('div');
      banner.style.background = '#ffdede';
      banner.style.color = '#900';
      banner.style.padding = '10px 16px';
      banner.style.fontSize = '13px';
      banner.textContent = 'Faltan imágenes en el proyecto. Revisa la consola para la lista de rutas.';
      document.body.insertBefore(banner, document.body.firstChild);
    }
  }, 600);
});
