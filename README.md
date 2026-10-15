# Portfolio · Ivan Navatta

Portfolio personal construido con **React 19 + Vite**, con escena **3D (Three.js / React Three Fiber)**, animaciones con **Motion**, smooth scroll con **Lenis**, sitio bilingüe **ES / EN** y formulario de contacto con **EmailJS**.

🌐 **En vivo:** https://ivannavatta.github.io

## Scripts

```bash
npm install       # instalar dependencias
npm run dev       # servidor de desarrollo → http://localhost:5173
npm run build     # build de producción en /dist
npm run preview   # previsualizar el build
npm run lint      # linter (oxlint)
```

## Arquitectura: Screaming Architecture

Las carpetas "gritan" **qué hace** la aplicación, no con qué está hecha. Cada feature es autocontenida (componentes, hooks, datos, servicios, estilos y traducciones) y expone solo su `index.js`. Las features **no se importan entre sí**; todo lo compartido vive en `shared/`.

```
src/
├── app/                      # Composición de la aplicación
│   ├── App.jsx               # Ordena las features en la página
│   ├── main.jsx              # Punto de entrada
│   └── providers/            # Idioma, Motion y smooth scroll
├── features/
│   ├── hero/                 # Portada con escena 3D y typewriter
│   ├── about/                # Sobre mí + tarjeta de perfil + contadores
│   ├── skills/               # Stack tecnológico por categoría
│   ├── projects/             # Proyectos, filtros y modal de detalle
│   ├── education/            # Línea de tiempo de formación
│   ├── contact/              # Formulario (EmailJS) + redes
│   └── navigation/           # Navbar, menú mobile, toggle de idioma
└── shared/
    ├── animations/           # Variants reutilizables de Motion
    ├── components/           # Button, Section, TiltCard, Loader, Cursor, Footer...
    ├── data/profile.js       # ⭐ Tus datos personales
    ├── hooks/                # useMediaQuery, useYearsCoding, useSmoothScroll...
    ├── i18n/                 # LanguageProvider + useTranslation
    └── styles/               # Variables de diseño y estilos globales
```

Estructura interna de una feature:

```
features/projects/
├── components/   # UI de la feature
├── data/         # Datos propios (projects.js)
├── hooks/        # Lógica (useProjectFilter)
├── i18n/         # es.js / en.js
├── Projects.module.css
└── index.js      # API pública → export { Projects }
```

## Cómo personalizarlo

| Qué querés cambiar | Archivo |
| --- | --- |
| Nombre, carrera, email, redes, foto, año en que empezaste a programar | `src/shared/data/profile.js` |
| **Proyectos** | `src/features/projects/data/projects.js` |
| Tecnologías | `src/features/skills/data/skills.js` |
| Formación / experiencia | `src/features/education/data/education.js` |
| Textos de cada sección | `src/features/<feature>/i18n/es.js` y `en.js` |
| Colores, tipografías, espaciados | `src/shared/styles/tokens.css` |
| CV descargable | Reemplazá `public/cv.pdf` |

- **Años programando**: se calculan solos a partir de `startYear`, así que el número nunca queda desactualizado.
- **Foto**: copiá tu imagen a `public/avatar.jpg` y poné `photo: '/avatar.jpg'` en `profile.js`.
- **Capturas de proyectos**: guardalas en `public/projects/` y usá `image: '/projects/mi-proyecto.png'`. Si no hay imagen, se genera una portada automática.
- **Proyecto destacado**: con `featured: true` la tarjeta ocupa el ancho completo.

## Configurar el formulario de contacto (EmailJS)

1. Creá una cuenta gratis en [emailjs.com](https://www.emailjs.com/).
2. **Email Services** → agregá tu Gmail → copiá el **Service ID**.
3. **Email Templates** → creá un template usando estas variables:
   - `{{from_name}}`, `{{from_email}}`, `{{message}}`
   - En "Reply To" poné `{{reply_to}}` para responder directo al remitente.
   - Copiá el **Template ID**.
4. **Account → General** → copiá la **Public Key**.
5. Copiá `.env.example` como `.env` y completá:

```env
VITE_EMAILJS_SERVICE_ID=service_xxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxx
```

6. Reiniciá `npm run dev`. Si faltan las claves, el formulario muestra un aviso con tu email como alternativa.

## Deploy

El sitio se publica en **GitHub Pages**: https://ivannavatta.github.io

Cada `git push` a `main` dispara el workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), que corre el linter, compila y publica automáticamente. El progreso se ve en la pestaña **Actions** del repo.

Para que el formulario de contacto funcione en producción, cargá las credenciales de EmailJS como secrets del repo (*Settings → Secrets and variables → Actions → New repository secret*):

- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

Después volvé a correr el workflow (*Actions → Deploy a GitHub Pages → Run workflow*).

## Accesibilidad y rendimiento

- Respeta `prefers-reduced-motion`: sin smooth scroll, 3D estático y animaciones mínimas.
- La escena 3D se carga en un chunk aparte (lazy) y deja de renderizar cuando sale de pantalla.
- El cursor custom solo aparece en dispositivos con mouse.
- Navegación por teclado, `aria-*` en controles y `lang` del documento según el idioma.
