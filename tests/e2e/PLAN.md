# Plan de pruebas e2e — portfolio (rediseño "pieza por pieza")

Fuente: mockup aprobado `mockup-3d/index.html` + `app.js`. Página única con las secciones `#inicio`,
`#perfil`, `#proyectos`, `#stack`, `#recorrido` y `#contacto`. Este plan se actualiza en cada ronda a
medida que se implementa cada sección.

## Cómo se corre

| Comando | Qué hace |
|---|---|
| `npm run test:e2e` | `npm run build` + `vite preview` en `127.0.0.1:5179` (con la **CSP real**) y corre todo |
| `npm run test:e2e:ui` | Lo mismo con la UI de Playwright |
| `npm run test:e2e:report` | Abre el último reporte HTML |
| `npx playwright test tests/e2e/smoke.spec.js --project=mobile` | Un archivo y un proyecto |
| `$env:E2E_SERVER='dev'; npm run test:e2e` | Contra `vite` dev (más rápido, **sin CSP**) |
| `$env:E2E_GL='swiftshader'` | WebGL por software (lo que usa CI en Linux) |

Proyectos (Chromium): `desktop` 1440×900, `tablet` 768×1024, `mobile` 375×812 (touch),
`desktop-reduced` y `mobile-reduced` (`reducedMotion: 'reduce'`).

## Reglas transversales (aplican a todos los tests)

- **Sin errores**: el fixture automático `pageErrors` falla el test ante `console.error`, `pageerror`
  o un 4xx/5xx del propio sitio.
- **CSP**: el fixture automático `cspViolations` falla el test ante cualquier `securitypolicyviolation`
  o mensaje de CSP en la consola. Se testea siempre sobre el build (preview) porque la CSP solo se
  inyecta ahí. Nada de `bypassCSP` ni de `<style>`/`<script>` inline desde los tests.
- **Nunca se mandan mails**: el fixture automático `noRealEmail` aborta y hace fallar cualquier llamada
  a `https://api.emailjs.com/**` sin mock. Los tests del formulario usan `stubEmailJs(page)`.
- **Movimiento reducido** se prueba solo con `reducedMotion: 'reduce'` (proyectos `*-reduced`). No se
  usan flags de debug por query string (`?reduced`).
- **Selectores**: `getByRole` con nombre accesible, después `getByLabel` y `getByText`; `data-testid`
  solo si no hay otra opción. Nada de clases CSS ni de XPath.
- **Esperas**: web-first assertions y los helpers (`waitForAppReady`, `waitForScrollSettled`). Nada de
  `waitForTimeout`.
- **Scroll real**: `wheelScroll` / `wheelUntilInView` / `wheelToBottom` usan `mouse.wheel`, que es lo
  que escuchan Lenis y la lógica de dirección de la nav. `jumpTo` solo para preparar el estado.
- **Accesibilidad**: `expectNoA11yViolations(page, { include: '#seccion' })` (axe, WCAG 2.1 A/AA) en
  cada sección, en `desktop` y en `mobile`, con el movimiento ya asentado.
- **Responsive**: `expectNoHorizontalOverflow(page)` en cada sección y en los tres tamaños.
- Cada test es independiente y arranca con `page.goto('/')`.

## Por sección

### 0. Global / smoke — `smoke.spec.js` ✅ (ronda 0)
- [x] La home responde 200, `<title>` con "Ivan Navatta", `lang` es-*, un solo `h1` visible.
- [x] Sin errores de consola, sin violaciones de CSP y sin overflow horizontal al cargar.
- [x] Recorrer toda la página con la rueda: sin overflow y el pie queda a la vista al final.
- [x] El build declara una CSP (header o `<meta http-equiv>`).
- [ ] Orden de los landmarks: `banner` → `main` → `contentinfo`; un `nav` "Secciones".
- [ ] Link "Saltar al contenido": es lo primero con Tab, se ve con foco y lleva el foco a `#perfil`.
- [ ] Sin dependencias rotas de terceros: con `blockThirdParty` la página sigue usable.

### 0b. CV — `cv.spec.js` ✅ (ronda 0)
- [x] SHA-256 de `public/cv.pdf` igual al de la versión revisada por seguridad (sin teléfono).
- [x] `/cv.pdf` servido = `public/cv.pdf`, `Content-Type: application/pdf`.
- [ ] Los links "Descargar CV" (hero, menú, contacto) tienen `download` y apuntan a `cv.pdf`.

### 1. Nav (`banner`, `nav` "Secciones")
- Logo "IN, volver al inicio" y los links Perfil, Proyectos, Stack, Recorrido y Contacto visibles en
  desktop y tablet.
- Clic en cada link: la sección llega arriba (`toBeInViewport`), el foco o el scroll terminan en la
  sección y el link correcto queda con `aria-current="location"`.
- **Ocultar/mostrar (desktop y tablet)**: arriba de todo (≤64 px) siempre visible; bajando ≥40 px con la
  rueda, se oculta; subiendo ≥24 px, aparece. Con foco de teclado adentro no se oculta.
- **Mobile (375)**: barra fija siempre visible. Botón "Abrir menú" (`aria-expanded="false"`,
  `aria-controls="menu"`):
  - al abrir: `aria-expanded="true"`, nombre "Cerrar menú", el panel muestra secciones y canales
    (Email, LinkedIn, GitHub, CV), `main` queda `inert` y el scroll bloqueado;
  - el foco queda atrapado (Tab y Shift+Tab ciclan entre logo, botón y links);
  - Escape cierra y devuelve el foco al botón;
  - un link de sección cierra el menú y lleva a la sección;
  - pasar de 375 a 1440 con el menú abierto lo cierra sin dejar `inert`.
- Contraste del tema de la nav sobre secciones claras y oscuras (axe sobre `banner` en dos posiciones).
- Áreas táctiles ≥ 44 px en mobile (`expectTargetSize`).

### 2. Hero (`#inicio`)
- `h1` "Ivan Navatta"; bajada y meta (Desarrollador · UADE · Buenos Aires) visibles.
- CTA "Ver proyectos" → `#proyectos`; "Descargar CV" tiene `download`.
- Canvas 3D y filas de texto decorativas con `aria-hidden` (fuera del árbol de accesibilidad).
- Con el pin y el scrub: después de bajar con la rueda, el hero se libera y aparece `#perfil` (sin
  saltos ni overflow).
- Reduced: sin animación de ensamble, contenido estático visible desde el primer frame.
- Sin WebGL (`no-gl`): el contenido sigue completo (opcional: deshabilitar WebGL por contexto).

### 3. Perfil (`#perfil`)
- `h2` "Negocio, datos y código."; lista de datos (Base, Formación, Programo desde) como `dl`.
- Tres principios como `h3` dentro de una lista.
- El texto que se revela por palabras queda completo y legible al terminar el scroll, y en reduced
  está completo desde el inicio (el texto accesible es el mismo en ambos modos).
- axe sobre `#perfil`, sin overflow en 375.

### 4. Proyectos (`#proyectos`, sección fijada)
- `h2` "Proyectos"; cuatro `article` con nombre accesible MyTube, Sistema de transporte, uadeHUB y
  box9.
- Con la rueda (desktop): el pin recorre los cuatro casos en orden y libera al final; cada caso queda
  a la vista en algún momento (`wheelUntilInView`).
- "Ver arquitectura" (botón, `aria-expanded`/`aria-controls`): abre el panel, que recibe foco o queda
  anunciado; volver a hacer clic lo cierra. Con teclado (Enter/Espacio).
- Links de repositorio: `target="_blank"` con `rel="noopener"` y aviso de pestaña nueva en el nombre.
- Figuras: el grafo (`role="img"` con `title`) y la matriz 9-box (`role="img"` con `aria-label`)
  tienen texto alternativo.
- Mobile: sin pin horizontal roto, casos apilados legibles y sin overflow.

### 5. Stack (`#stack`)
- `h2` "Stack, por capas"; cinco capas (`h3`: Interfaz, Backend, Datos, Herramientas, Método).
- Cada tile es un `button` con su uso en el nombre accesible (texto `sr-only`).
- Hover y foco con Tab actualizan el panel de detalle (que es `aria-hidden`: la info llega por el
  nombre del botón); foco visible en cada tile (`expectVisibleFocus`).
- Recorrer todos los tiles con Tab sin trampas de foco.

### 6. Recorrido (`#recorrido`)
- `h2` "Recorrido"; lista ordenada (`ol`) con cinco pasos (`h3`): Desarrollo Web, JavaScript,
  React Js, Programación Backend, Lic. en Gestión de TI.
- "Ver certificado" (`aria-expanded`): muestra la imagen con alt "Certificado de Coderhouse del
  curso …", desde `res.cloudinary.com` (permitido por la CSP en `img-src`); Escape lo cierra.
- Sin violaciones de CSP al cargar los certificados.

### 7. Contacto (`#contacto`) — siempre con `stubEmailJs(page)`
- `h2` "Contacto"; canales: Email (mailto), LinkedIn, GitHub, CV (descarga).
- "Copiar email": con permiso `clipboard-write`/`clipboard-read`, el portapapeles tiene
  `ivannavatta@gmail.com`, el botón dice "Copiado" y el `status` anuncia "Email copiado…"; vuelve
  al texto original.
- Mobile: "Escribir un mensaje" (`aria-expanded`) muestra el formulario y lleva el scroll hasta él.
- Formulario (labels Nombre, Email, Mensaje):
  - envío vacío → tres errores asociados por `aria-describedby`, `aria-invalid="true"` y foco en el
    primer campo inválido; no hay request a EmailJS;
  - email inválido → mensaje específico;
  - los errores se actualizan mientras se escribe, después del primer intento;
  - envío válido con stub 200 → estado "Enviando…" con `aria-busy` y botón deshabilitado, después el
    mensaje de éxito en el `status`, formulario limpio; se verifica el payload interceptado;
  - stub 500 → mensaje de error visible y anunciado, sin perder lo escrito.
- Pie: "Volver al inicio" lleva a `#inicio`.

## Transversal por tamaño y modo

| Chequeo | desktop | tablet | mobile | *-reduced |
|---|---|---|---|---|
| Sin errores de consola ni de CSP | ✔ | ✔ | ✔ | ✔ |
| Sin overflow horizontal por sección | ✔ | ✔ | ✔ | ✔ |
| axe WCAG 2.1 AA por sección | ✔ | — | ✔ | ✔ |
| Nav: ocultar/mostrar con la rueda | ✔ | ✔ | (fija) | — |
| Menú hamburguesa | — | — | ✔ | ✔ |
| Teclado: orden de Tab y foco visible | ✔ | — | ✔ | — |
| Pins y scrub de GSAP | ✔ | ✔ | ✔ | sin pin/scrub, contenido estático |

## Fuera de alcance (por ahora)
- Firefox y WebKit (se suman si hay tiempo; WebKit no soporta `mouse.wheel` en mobile).
- Regresión visual por capturas (los pins y el 3D hacen que sea frágil; evaluar con `animations: 'disabled'`
  y máscaras sobre el canvas).
- Lector de pantalla real (NVDA/VoiceOver): se revisa a mano en las rondas de accesibilidad.

## Propuesta de CI (no creada)
Workflow aparte, por ejemplo `.github/workflows/e2e.yml`: disparado con `pull_request` (nunca
`pull_request_target`), `permissions: contents: read`, sin secrets, `npm ci` →
`npx playwright install --with-deps chromium` → `npm run test:e2e` con `CI=1` (en Linux toma
SwiftShader solo) y subida de `playwright-report/` como artifact.
