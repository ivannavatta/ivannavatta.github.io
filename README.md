# Portfolio · Ivan Navatta

Portfolio personal construido con **React 19 + Vite**. Diseño **"Pieza por pieza"**: un monograma **IN** en 3D hecho de bloques (**Three.js**) que se arma y desarma a lo largo de la página, transiciones guiadas por el scroll (**GSAP ScrollTrigger** + **Lenis**) y formulario de contacto con **EmailJS**. El sitio está en español.

🌐 **En vivo:** https://ivannavatta.github.io

## Scripts

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo → http://localhost:5173
npm run build        # build de producción en /dist (con la CSP real)
npm run preview      # previsualizar el build
npm run lint         # linter (oxlint)
npm run test:e2e     # tests end-to-end con Playwright (build + preview)
npm run test:e2e:ui  # lo mismo, con la interfaz de Playwright
```

`dev` y `build` bajan primero la fuente **General Sans** (`scripts/fetch-fonts.mjs`): su licencia no permite versionarla, así que no está en el repo y se verifica con un SHA-256 fijo. La primera vez hace falta conexión a internet.

## Arquitectura: Screaming Architecture

Las carpetas "gritan" **qué hace** la aplicación, no con qué está hecha. Cada feature es autocontenida (componentes, hooks, datos, servicios, estilos y textos) y expone solo su `index.js`. Lo compartido vive en `shared/`.

```
src/
├── app/                      # App.jsx (orden de las secciones), main.jsx y providers
├── features/
│   ├── navigation/           # Nav con el IN, links unidos por una traza; menú mobile
│   ├── hero/                 # Inicio: nombre, bajada, CTAs y pin del scroll
│   ├── about/                # Perfil: declaración que se revela palabra por palabra
│   ├── projects/             # Proyectos apilados con figura y "Ver arquitectura"
│   ├── skills/               # Stack por capas (cada tecnología es un bloque del IN)
│   ├── education/            # Recorrido: cursos, carrera y certificados
│   ├── contact/              # Canales, copiar email y formulario (EmailJS)
│   └── stage/                # Escena 3D: el IN de bloques y sus poses por sección
└── shared/
    ├── components/           # Button, TextLink, Monogram, CircuitTraces...
    ├── data/                 # ⭐ profile.js (tus datos) y certifications.js
    ├── hooks/                # useMediaQuery, useFocusTrap
    ├── scroll/               # Lenis + GSAP ScrollTrigger y preferencia de movimiento
    ├── stage/                # Contrato entre las secciones y la escena 3D
    └── styles/               # Tokens de diseño, fuentes y estilos globales
```

## Cómo personalizarlo

| Qué querés cambiar | Archivo |
| --- | --- |
| Nombre, carrera, email, redes, año en que empezaste a programar | `src/shared/data/profile.js` |
| **Proyectos** (links y figura) | `src/features/projects/data/projects.js` |
| Textos de los proyectos (problema, rol, stack) | `src/features/projects/i18n/es.js` |
| Tecnologías del Stack y dónde las usaste | `src/features/skills/i18n/es.js` |
| Cursos, horas e imágenes de certificados | `src/shared/data/certifications.js` |
| Pasos del Recorrido | `src/features/education/data/steps.js` e `i18n/es.js` |
| Textos de cada sección | `src/features/<feature>/i18n/es.js` |
| Colores, tipografías, espaciados | `src/shared/styles/tokens.css` |
| CV descargable | Reemplazá `public/cv.pdf` (versión **sin teléfono**) |

- **Años programando**: se calculan solos a partir de `startYear`.
- **Certificados**: solo se muestran imágenes de la cuenta de Cloudinary `dvcmgnvwi` (es lo que permite la CSP en `vite.config.js`). Si cambiás de cuenta, actualizá `img-src` y el filtro de `education/data/steps.js`.
- **Repos de proyectos**: si un repositorio todavía es privado, dejá el proyecto sin link (hay un `TODO` en `projects.js` para el TPO).

## Configurar el formulario de contacto (EmailJS)

El formulario de Contacto envía con EmailJS, sin backend propio (`src/features/contact/services/emailService.js`).

1. Creá una cuenta gratis en [emailjs.com](https://www.emailjs.com/).
2. **Email Services** → agregá tu Gmail → copiá el **Service ID**.
3. **Email Templates** → creá un template con las variables que manda el sitio:
   - `{{from_name}}`: nombre de quien escribe.
   - `{{from_email}}`: su email.
   - `{{message}}`: el mensaje.
   - En "Reply To" poné `{{reply_to}}` (es el mismo email) para responder directo al remitente.
   - En "To Email" poné tu email **fijo** (nunca una variable) y dejá **Auto-Reply** desactivado: así nadie puede usar el formulario para mandarle mails a terceros.
   - Copiá el **Template ID**.
4. **Account → General** → copiá la **Public Key** (es pública por diseño: va en el bundle).
   - No actives **Use Private Key**: el formulario envía desde el navegador y dejaría de funcionar.
   - Limitar los dominios permitidos es una función paga de EmailJS. Sin eso, el abuso posible es acotado: el destinatario es fijo (tu email), no hay auto-reply y, en el plan gratis, lo peor es agotar el cupo mensual.
5. Copiá `.env.example` como `.env` (no se versiona) y completá:

```env
VITE_EMAILJS_SERVICE_ID=service_xxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxx
```

6. Reiniciá `npm run dev`.

Cómo se comporta:

- **Sin claves** el sitio funciona igual: el formulario avisa que el envío todavía no está activo y ofrece el email. Al enviar, arma el mensaje para abrirlo en el correo. No hace ninguna llamada.
- Valida al enviar (nombre, email con dominio, mensaje de 10 caracteres o más) y lleva el foco al primer campo con error. Después del primer intento, los errores se actualizan mientras se escribe.
- Protecciones: `maxLength` en los campos, un campo trampa (honeypot) para bots, `blockHeadless` (no envía desde navegadores automatizados) y `limitRate` (un envío cada 10 s por navegador).
- Tests e2e: EmailJS siempre se intercepta (`stubEmailJs`). Como `blockHeadless` corta los navegadores automatizados, los tests de envío tienen que simular `navigator.webdriver = false`.
- La CSP del build ya permite `connect-src https://api.emailjs.com`.

## Deploy

El sitio se publica en **GitHub Pages**: https://ivannavatta.github.io

Cada `git push` a `main` dispara el workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), que corre el linter, compila y publica automáticamente. El progreso se ve en la pestaña **Actions** del repo.

Para que el formulario de contacto funcione en producción, cargá las credenciales de EmailJS como secrets del repo (*Settings → Secrets and variables → Actions → New repository secret*):

- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

Después volvé a correr el workflow (*Actions → Deploy a GitHub Pages → Run workflow*).

## Tests end-to-end

Los tests viven en `tests/e2e/` (plan y reglas en [`tests/e2e/PLAN.md`](tests/e2e/PLAN.md)). Corren con Chromium en desktop, tablet, mobile y con movimiento reducido, contra el build con la CSP real. Nunca mandan mails: EmailJS siempre se intercepta.

## Accesibilidad y rendimiento

- Respeta `prefers-reduced-motion`: sin smooth scroll, sin pins ni scrub; el IN queda plano y el contenido estático.
- WCAG 2.1 AA verificado con axe y con mediciones de contraste sobre el canvas 3D.
- Navegación completa por teclado, foco visible, objetivos táctiles de 44 px o más y link "Saltar al contenido".
- CSP estricta en el build: solo recursos propios, imágenes de Cloudinary y `api.emailjs.com`.
