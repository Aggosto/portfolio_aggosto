document.addEventListener('DOMContentLoaded', function(){
  const placeholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="%23000"/><text x="50%" y="50%" fill="%23fff" font-size="20" font-family="Arial" text-anchor="middle" dominant-baseline="middle">Imagen no encontrada</text></svg>';
  const missing = new Set();
  const lbImages = [];   // flat registry of all carousel images
  let lbCurrentIdx = -1;

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
    if(!data) return;

    // Construir secciones (digital y real)
    ['digital', 'real'].forEach(sectionKey => {
      const projects = data[sectionKey] || [];
      const section = document.querySelector(`#${sectionKey}`);
      if(!section) return;

      const container = section.querySelector('.projects');
      if(!container) return;

      const projectsHtml = projects
        .map(project => {
          if(!project.images || project.images.length === 0) {
            // Proyecto sin imágenes
            return `
              <div class="project" data-id="${project.id}">
                <div class="project-header" style="opacity: 0.5;">
                  <div class="project-title">${project.title}</div>
                  <div class="project-actions">
                    <div class="caption">${project.caption || ''}</div>
                  </div>
                </div>
                <div style="padding: 20px 0; color: #999; font-size: 12px;">
                  Próximamente...
                </div>
              </div>
            `;
          }

          // Album layout: pattern with 'stack' groups 2 images into one vertical column item
          const pattern = ['tall', 'stack', 'wide', '', 'stack', 'large', 'square', 'stack', 'small', 'stack'];
          const imagesArr = project.images;
          const htmlParts = [];
          let imgIdx = 0, patIdx = 0;

          const makeImgTag = (image) => {
            const src = buildCloudinaryUrl(image);
            if (!src) return null;
            const alt = image.alt ? image.alt.replace(/"/g, '&quot;') : '';
            return { src, alt, caption: image.caption || '', detail: image.detail || '' };
          };

          while (imgIdx < imagesArr.length) {
            const p = pattern[patIdx % pattern.length];
            patIdx++;

            if (p === 'stack' && imgIdx + 1 < imagesArr.length) {
              // Consume 2 images — render as vertical pair
              const a = makeImgTag(imagesArr[imgIdx]);
              const b = makeImgTag(imagesArr[imgIdx + 1]);
              if (a && b) {
                const idxA = lbImages.length;
                lbImages.push({ ...a, series: project.caption || '' });
                const idxB = lbImages.length;
                lbImages.push({ ...b, series: project.caption || '' });
                htmlParts.push(
                  `<div class="carousel-item stack">` +
                    `<div class="mosaic-item"><img src="${a.src}" alt="${a.alt}" data-lb-idx="${idxA}"><button class="select-btn" aria-pressed="false" title="Seleccionar imagen">✓</button></div>` +
                    `<div class="mosaic-item"><img src="${b.src}" alt="${b.alt}" data-lb-idx="${idxB}"><button class="select-btn" aria-pressed="false" title="Seleccionar imagen">✓</button></div>` +
                  `</div>`
                );
              }
              imgIdx += 2;
            } else {
              // Single image — use size class (treat leftover 'stack' as default)
              const sizeClass = (p === 'stack') ? '' : p;
              const image = imagesArr[imgIdx];
              const t = makeImgTag(image);
              if (t) {
                const lbIdx = lbImages.length;
                lbImages.push({ ...t, series: project.caption || '' });
                htmlParts.push(
                  `<div class="carousel-item ${sizeClass}">` +
                    `<div class="mosaic-item"><img src="${t.src}" alt="${t.alt}" data-lb-idx="${lbIdx}"><button class="select-btn" aria-pressed="false" title="Seleccionar imagen">✓</button></div>` +
                  `</div>`
                );
              }
              imgIdx++;
            }
          }

          const images = htmlParts.join('');

          return `
            <div class="project" data-id="${project.id}">
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
                <div class="project-footer"></div>
              </div>
            </div>
          `;
        })
        .join('');

      container.innerHTML = projectsHtml;
    });
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

  // Toggle section open/close (DIGITAL, REAL)
  document.querySelectorAll('.section-header').forEach(header=>{
    header.addEventListener('click', ()=>{
      const section = header.parentElement;
      const body = section.querySelector('.section-body');
      const icon = header.querySelector('.toggle-icon');
      const opened = section.classList.contains('open');
      section.classList.toggle('open', !opened);
      header.setAttribute('aria-expanded', String(!opened));
      body.setAttribute('aria-hidden', String(opened));
      if(icon) icon.textContent = opened ? '+' : '−';
      // No scroll — mantener la posición del usuario
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
        // No scrollIntoView — mantener la posición del usuario
      }
    });
  });

  // Carousel navigation — scroll by ~60% of visible track width
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const carousel = btn.closest('.carousel');
      const track = carousel.querySelector('.carousel-track');
      const scrollAmount = track.clientWidth * 0.6;
      const dir = btn.classList.contains('next') ? 1 : -1;
      track.scrollBy({left: dir * scrollAmount, behavior:'smooth'});
    });
  });

  // Header navigation: smooth scroll with highlight animation
  document.querySelectorAll('header nav a[href^="#"]').forEach(link=>{
    link.addEventListener('click', (e)=>{
      e.preventDefault();
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if(!target) return;
      target.scrollIntoView({behavior:'smooth', block:'start'});
      target.classList.add('section-announce');
      setTimeout(()=> target.classList.remove('section-announce'), 900);
    });
  });

  // Nav active state: click + scroll observer
  const navLinks = Array.from(document.querySelectorAll('header nav a[href^="#"]'));
  const sections = navLinks.map(a=> document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  const setActiveLink = (link)=> navLinks.forEach(l=> l.classList.toggle('active', l === link));
  navLinks.forEach(link=>{
    link.addEventListener('click', ()=> setActiveLink(link));
  });

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(ent=>{
      if(ent.isIntersecting){
        const id = ent.target.id;
        const link = document.querySelector(`header nav a[href="#${id}"]`);
        link && setActiveLink(link);
      }
    });
  }, {threshold: 0.45});
  sections.forEach(s=> io.observe(s));

  // Make carousel keyboard-focusable and add basic arrow support
  document.querySelectorAll('.carousel-track').forEach(track=>{
    track.setAttribute('tabindex','0');
    track.addEventListener('keydown', (e)=>{
      if(e.key === 'ArrowRight') track.scrollBy({left: 300, behavior:'smooth'});
      if(e.key === 'ArrowLeft') track.scrollBy({left: -300, behavior:'smooth'});
    });
  });

  // Selection behavior: toggle selection when pressing select button
  document.querySelectorAll('.project').forEach(project=>{
    project.querySelectorAll('.select-btn').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const pressed = btn.getAttribute('aria-pressed') === 'true';
        btn.setAttribute('aria-pressed', String(!pressed));
        const item = btn.closest('.carousel-item');
        item && item.classList.toggle('selected', !pressed);
      });
    });
  });

  // Lightbox
  const lightbox      = document.getElementById('lightbox');
  const lightboxImg   = lightbox?.querySelector('img');
  const lightboxTitle = lightbox?.querySelector('.lightbox-title');
  const lightboxDetail= lightbox?.querySelector('.lightbox-detail');
  const lightboxCtr   = lightbox?.querySelector('.lightbox-counter');
  const lightboxClose = lightbox?.querySelector('.lightbox-close');
  const lightboxPrev  = lightbox?.querySelector('.lightbox-prev');
  const lightboxNext  = lightbox?.querySelector('.lightbox-next');

  const openLightbox = (idx) => {
    if (!lightbox || !lightboxImg || idx < 0 || idx >= lbImages.length) return;
    lbCurrentIdx = idx;
    const item = lbImages[idx];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt;
    if (lightboxTitle)  lightboxTitle.textContent  = item.caption || item.alt;
    if (lightboxDetail) lightboxDetail.textContent = [item.series, item.detail].filter(Boolean).join('  ·  ');
    if (lightboxCtr)    lightboxCtr.textContent    = `${String(idx + 1).padStart(2,'0')} / ${String(lbImages.length).padStart(2,'0')}`;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    if (lightboxImg) lightboxImg.src = '';
  };

  document.querySelectorAll('.carousel-item img, .gallery-item img').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      const idx = parseInt(img.dataset.lbIdx);
      if (!isNaN(idx)) openLightbox(idx);
    });
  });

  lightboxPrev?.addEventListener('click', () => openLightbox(lbCurrentIdx - 1));
  lightboxNext?.addEventListener('click', () => openLightbox(lbCurrentIdx + 1));
  lightboxClose?.addEventListener('click', closeLightbox);

  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape')      closeLightbox();
    if (event.key === 'ArrowRight' && lightbox.classList.contains('open')) openLightbox(lbCurrentIdx + 1);
    if (event.key === 'ArrowLeft'  && lightbox.classList.contains('open')) openLightbox(lbCurrentIdx - 1);
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
