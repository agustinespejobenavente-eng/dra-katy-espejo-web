# Sitio web · Dra. Katy Espejo

Prototipo del sitio de presentación de la Dra. Katherine Espejo B., cirujana dentista especialista en rehabilitación oral, en Puerto Montt.

Es un sitio estático (HTML, CSS y JavaScript, sin framework):

- `nuevo/`: el sitio vigente (`index.html`, `styles.css`, `script.js`).
- `index.html` (raíz): solo redirige a `nuevo/`.
- `privacidad.html`, `terminos.html` y `styles.css` (raíz): borradores legales con su estilo, pendientes de pasar al diseño nuevo.
- `img/` y `fonts/`: fotos, logo y tipografías alojadas en el propio sitio.

La primera versión del sitio quedó guardada en la etiqueta de git `sitio-primera-version`.

## Estado

Prototipo para revisión. Faltan las fotos, el logo, los casos reales de pacientes (con autorización escrita) y la dirección de la consulta. La página tiene `noindex` para que Google no la muestre hasta publicarla.

## Ver en local

Abrir con cualquier servidor estático, por ejemplo:

```bash
npx http-server . -p 5173
```
