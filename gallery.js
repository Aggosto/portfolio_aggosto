document.addEventListener('DOMContentLoaded', function(){
  const placeholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="%23000"/><text x="50%" y="50%" fill="%23fff" font-size="20" font-family="Arial" text-anchor="middle" dominant-baseline="middle">Imagen no encontrada</text></svg>';
  const missing = new Set();

  const buildCloudinaryUrl = (item) => {
    if(item.src) return item.src;
    const cloudName = window.GALLERY_DATA?.cloudName;
    if(!cloudName || !item.publicId) return '';
    const format = item.format || 'webp';
    const transformation = item.transformation || '';
    const path = transformation ? `${transformation}/` : '';
    return `https://res.cloudinary.com/${cloudName}/image/upload/${path}${item.publicId}.${format}`;
  };

  const buildGalleryFromData = () => {
    const data = window.GALLERY_DATA;
    if(!data?.digital?.length) return;
    const container = document.querySelector('#digital .projects');
    if(!container) return;

    const projectsHtml = data.digital.map(project => {
      const images = project.images
        .map(image => {
          const src = buildCloudinaryUrl(image);
          if(!src) return '';
          const alt = image.alt ? image.alt.replace(/"/g, '&quot;') : '';
          return `<div class="carousel-item"><img src="${src}" alt="${alt}"></div>`;
        })
        .join('');

      return `
        <div class="project" data-id="${project.id || project.title.toLowerCase().replace(/\s+/g,'-')}">
          <button class="project-header" aria-expanded="false">
            <div class="project-title">${project.title}</div>
            <div class="project-actions">
              <div class="caption">${project.caption || ''}</div>
            </div>
          </button>
          <div class="project-body" aria-hidden="true">
            <div class="carousel">
              <button class="nav-btn prev" aria-label="Anterior">‹</button>
              <div class="carousel-track">
                ${images}
              </div>
              <button class="nav-btn next" aria-label="Siguiente">›</button>
            </div>
            <div class="project-footer">
              <a class="view-all" href="${project.url || '#'}">Ver todas</a>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = projectsHtml;
  };

  buildGalleryFromData();

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

  // Lightbox: click image to enlarge
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox?.querySelector('img');
  const lightboxCaption = lightbox?.querySelector('.lightbox-caption');
  const lightboxClose = lightbox?.querySelector('.lightbox-close');

  const openLightbox = (img)=>{
    if(!lightbox || !lightboxImg) return;
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || 'Imagen ampliada';
    lightboxCaption.textContent = img.alt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = ()=>{
    if(!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    if(lightboxImg) lightboxImg.src = '';
  };

  document.querySelectorAll('.carousel-item img, .gallery-item img').forEach(img=>{
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', ()=> openLightbox(img));
  });

  lightbox?.addEventListener('click', (event)=>{
    if(event.target === lightbox || event.target === lightboxClose){
      closeLightbox();
    }
  });

  window.addEventListener('keydown', (event)=>{
    if(event.key === 'Escape') closeLightbox();
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
