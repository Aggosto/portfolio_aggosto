Proyecto: Portafolio - Visual Archive

Estructura recomendada:

- index.html
- styles.css
- gallery.js
- imagenes/
  - digital/
    - gtaiv_01.jpg
    - gtaiv_02.jpg
    - ...
  - real/
    - street_01.jpg
    - ...

Qué hice:
- Separé el CSS a `styles.css`.
- Añadí `gallery.js` que gestiona la apertura de proyectos y el scroll de carruseles.
- `gallery.js` sustituye imágenes rotas por un placeholder SVG y muestra un banner si faltan imágenes.

Cómo probar localmente:

1. Desde la carpeta del proyecto ejecuta:

```bash
python -m http.server 8000
```

2. Abre tu navegador en http://localhost:8000

Configurar Cloudinary:

1. En tu cuenta de Cloudinary copia tu `cloud name` desde el panel.
2. Abre `gallery-data.js` y pega tu nombre en `cloudName`.
3. Sube las imágenes a Cloudinary en una carpeta (por ejemplo `gtaiv`).
4. Guarda en `gallery-data.js` los `publicId` de cada imagen, sin extensión.
5. Actualiza el campo `caption` si quieres textos diferentes.

Notas y recomendaciones:
- Asegúrate de colocar las imágenes en `imagenes/digital` y `imagenes/real` con los nombres que usa `index.html`.
- Si prefieres que las secciones se generen automáticamente desde un JSON, puedo añadir un `data/projects.json` y cargarlo dinámicamente.
- Puedo añadir un modal para "Ver todas" o una página separada por proyecto.
