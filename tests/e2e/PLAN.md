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
  Los deltas son píxeles CSS: el helper compensa que Chromium divide `deltaY` por el DPR (mobile ×2).
- **Bugs conocidos**: el test que lo prueba queda con `test.fail(cond, 'BUG id: …')`; cuando se
  corrige, Playwright avisa "expected to fail but passed" y se saca la marca.
- **Accesibilidad**: `expectNoA11yViolations(page, { include: '#seccion' })` (axe, WCAG 2.1 A/AA) en
  cada sección, en `desktop` y en `mobile`, con el movimiento ya asentado.
- **Contraste**: con movimiento, el canvas y las trazas detrás del texto hacen que axe deje
  `color-contrast` en "incomplete" (no lo mide; el helper lo anota). Por eso cada chequeo de axe va
  acompañado de `expectReadableContrast(page, selector)` (contrast.js), que mide a mano. Antes de axe,
  `waitForAnimationsToFinish(page, selector)`: a mitad de un fade axe mide contraste con opacidad
  parcial y da falsos positivos.
- **Listo**: `waitForAppReady` exige `<html data-motion>` en `ready`, `reduced` o `static` (`pending`
  no cuenta).
- **Warnings vigilados**: el fixture `watchedWarnings` anota sin fallar los warnings intermitentes
  (por ahora, "preloaded … but not used").
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

### 1. Nav — `navigation.spec.js` ✅ (ronda 1)
Escritorio y tablet (≥768):
- [x] IN ("IN, volver al inicio") y los cinco links en orden con su `href`; sin botón de menú ni canales.
- [x] `aria-current="location"` sigue al capítulo (IN arriba de todo, un solo link marcado por vez).
- [x] Arriba de todo (≤64 px) no se oculta aunque se baje más de 40 px.
- [x] Rueda real: se oculta al acumular ≥40 px hacia abajo y aparece con ≥24 px hacia arriba; 30 px y
      16 px no alcanzan; el cambio de sentido reinicia el acumulado. `data-nav-state` y panel `inert`.
- [x] Oculta: Tab llega al IN, que revela la nav y libera el panel; con foco adentro no se oculta;
      al salir con Tab vuelve a ocultarse al bajar.
- [x] Clic en cada link: el h2 de destino recibe el foco, queda en pantalla y el link queda marcado.
- [x] El IN vuelve al inicio, enfoca el h1 y marca `aria-current`.
- [x] Foco visible en el IN y en cada link; objetivos ≥24 px.
- [x] axe sobre `header` en sección clara y oscura (después de la transición de tema); sin overflow.

Mobile (<768):
- [x] Barra fija (no se oculta al bajar); "Abrir menú" con `aria-expanded="false"` y `aria-controls="menu"`.
- [x] Abrir: `aria-expanded="true"`, nombre "Cerrar menú", foco en el botón, cinco secciones y cuatro
      canales, `main` y el salto `inert`, `overflow: hidden` y la rueda no desplaza.
- [x] Foco atrapado: Tab da la vuelta completa (secciones, canales, IN, botón); Shift+Tab al revés.
- [x] Escape cierra, devuelve el foco al botón y libera la página (vuelve a desplazarse).
- [x] Cada link cierra, enfoca el h2 de destino, libera la página, desplaza y marca el link.
- [x] Pasar a 1440 con el menú abierto lo cierra sin dejar `inert` ni el scroll bloqueado.
- [x] Objetivos táctiles ≥44 px (IN, botón, links y canales); foco visible.
- [x] axe sobre `header` cerrado y abierto (después de la entrada escalonada); sin overflow.

Movimiento reducido (*-reduced):
- [x] `data-motion="reduced"`, sin Lenis ni `html.live`; los links saltan sin animación y enfocan el h2.
- [x] Todos los tests de arriba corren también en `desktop-reduced` y `mobile-reduced`.

### 2. Hero — `hero.spec.js` ✅ (ronda 2)
- [x] Un solo `h1` "Ivan Navatta"; snapshot de accesibilidad de `#inicio` (región, bajada, meta, dos
      links y el h1): las filas, el IN, la firma y las trazas no aparecen.
- [x] Filas, IN, firma, trazas y canvas con `aria-hidden`, sin nada enfocable adentro.
- [x] "Ver proyectos" → foco en el h2 "Proyectos" y en pantalla.
- [x] "Descargar CV" → `/cv.pdf` con `download`, sin `target`, y la descarga ocurre (`cv.pdf`).
- [x] CTAs ≥44 px, alcanzables con Tab, foco visible y sin nada que capture el puntero encima.
- [x] axe sobre `#inicio` arriba de todo y a mitad del pin; sin overflow.
- [x] Pin: el bloque queda fijado arriba, el marco se encoge, se libera al bajar con la rueda, no se
      superpone con Perfil ni lo tapa, y al volver arriba el scrub se deshace.
- [x] Sin overflow horizontal en ningún punto del pin.
- [x] Reducido: sin `pin-spacer`, filas ni firma, marco sin escala; el inicio se desplaza como una
      sección más y el contenido está opaco desde el arranque.
- [ ] (bug abierto `hero-firma`) La firma no captura el puntero: hoy `test.fail`.

### 2b. Links y botones (toda la página) — `links.spec.js` ✅ (ronda 2)
Cubre `Button`, `TextLink`, la nav y cualquier componente nuevo sin test propio:
- [x] Externos: https, `target="_blank"`, `rel` con `noopener` y `noreferrer`, nombre con
      "(se abre en otra pestaña)".
- [x] Internos `#id` con destino existente; sin `href` vacío ni `javascript:`.
- [x] Descargas de mismo origen y sin `target`. Todo `<button>` con `type`.

### 3. Perfil — `about.spec.js` ✅ (ronda 3)
- [x] Un h2; dl con 3 pares (Base, Formación, Programo desde) en orden; lista con 3 ítems y su h3;
      snapshot de accesibilidad de la región (el IN no aparece).
- [x] Declaración: texto completo en el DOM y renderizado sin palabras pegadas; una palabra por span
      y ningún espacio adentro de los span.
- [x] IN: `aria-hidden`, `pointer-events: none`, nada enfocable, y quieto mientras se lee si es sticky.
- [x] Reveal con rueda real: nada en tinta antes del 85 %, avance monótono y progresivo (≥3 estados
      intermedios), todo en tinta al pasar el 45 %, y reversible al subir.
- [x] axe y contraste propio en `#perfil` con palabras grises y con todo en tinta (tema asentado).
- [x] Reducido: todas las palabras en tinta desde el arranque; axe y contraste.
- [x] Continuidad inicio → Perfil → Proyectos: nada tapado, sin superposición ni overflow.
- [ ] (bug abierto `theme-mix-contrast`) Contraste AA del texto visible durante las mezclas de tema:
      hoy `test.fail` en los proyectos con movimiento.

### 4. Proyectos — `projects.spec.js` ✅ (ronda 4)
- [x] h2, bajada y cuatro `article` (MyTube, Sistema de transporte, uadeHUB, box9) con
      `aria-labelledby`, h3, ficha Problema/Rol/Stack y "Ver arquitectura" (`aria-expanded`,
      `aria-controls`); base de ladrillos `aria-hidden`.
- [x] Links: repositorios con "(se abre en otra pestaña)", `target="_blank"` y `rel` seguro;
      Transporte sin links (repo privado); ningún link al TPO ni al deploy de MyTube.
- [x] Figuras con epígrafe; grafo `role="img"` con `<title>` y letras ocultas; consola en
      `pre > code` con `<mark>`; matriz `role="img"` con `aria-label`.
- [x] "Ver arquitectura" ↔ "Ver resumen" con Enter y Espacio; el foco no se pierde; vuelve la figura.
- [x] Tab y Shift+Tab por los cuatro casos: cada foco visible (opacidad 1), en pantalla y sin nada
      encima (el salto del apilado funciona en los dos sentidos); foco visible.
- [x] Pin con rueda real en 1440×900 y 1024×900 (apila en orden, el último queda adelante, los que
      esperan no capturan el puntero) y lista en 1440×700; la bajada nunca queda tapada; sin overflow.
- [x] Con el panel abierto en el apilado, el caso entra entero y nada lo tapa.
- [x] Inclinación 3D solo con puntero fino.
- [x] axe y contraste propio, también con un panel abierto. Reducido: lista, sin pin ni transform.

### 4b. Costuras y cabecera — `seams.spec.js` ✅ (ronda 4)
- [x] Con movimiento, una costura por cada borde claro/oscuro; en reducido, ninguna.
- [x] Cada borde entre capítulos, barrido en pasos de 20 px mientras la costura se arma y de 40 px
      después: contraste AA de las dos secciones (contando los bloques detrás del texto) y ningún
      texto con un bloque encima.
- [ ] (bug abierto `seam-surface-lag`) `data-surface` y `theme-color` = color real bajo la cabecera
      en cada borde: hoy `test.fail` con movimiento (desfase de 48 px).

### 5. Stack — `skills.spec.js` ✅ (ronda 5)
- [x] Un `h2` "Stack, por capas" (`aria-labelledby`), bajada y cinco capas en orden (`h3`: Interfaz,
      Backend, Datos, Herramientas, Método), cada una con su lista; snapshot de accesibilidad de la región
      (el panel y los bloques del IN no aparecen).
- [x] 17 tecnologías, cada una un `button type="button"` con nombre "<tecnología>: <uso>"; lo visible es
      solo el nombre y el uso va en un `sr-only` (1×1).
- [x] Panel "Dónde la usé": `aria-hidden`, sin nada enfocable ni live regions; estado inicial con la pista.
- [x] Tab recorre las 17 en orden: foco visible, panel con su uso, tecla activa, al menos media tecla en
      pantalla y sin nada encima; la escena recibe `stage:hover` 0…16 y -1 al salir; el foco sale de
      `#stack` (sin trampa) y el panel conserva la última. Shift+Tab al revés y vuelve a entrar.
      Las teclas cortadas por el borde (el navegador no desplaza si ya se ven en parte) quedan anotadas.
- [x] Enter y Espacio sobre una tecla la muestran en el panel.
- [x] Puntero fino: hover sobre cada tecla actualiza el panel y la marca; al salir, baja y el panel
      conserva la última. Puntero grueso: pasar por encima no cambia nada, el toque sí.
- [x] IN desarmado: un `data-stage-block` por botón (y nada más); canvas, costuras y trazas con
      `aria-hidden`, `pointer-events: none` y nada enfocable; con la pose asentada, el centro de cada
      tecla lo recibe su botón.
- [x] Píxeles reales (helper `pixels.js`): con escena viva el botón es transparente y detrás de cada tecla
      se ve un bloque (no el fondo de la sección); texto AA sobre el color real del bloque. En reducido,
      teja plana `--tile`.
- [ ] (bug abierto `stack-active-contrast`) La tecla activa con escena viva (bloque iluminado ≈
      rgb(65,128,138)) deja el texto en ≈3,9–4,4:1: pasa como texto grande en escritorio (28 px) pero no en
      tablet (23,7 px) ni mobile (18 px). Hoy `test.fail` en `tablet` y `mobile`.
- [x] Teclas ≥44 px, dentro del ancho; sin overflow recorriendo la sección con la rueda (3 tamaños).
- [x] axe y contraste propio en `#stack` con la pose asentada y con una tecla activa (desktop, mobile y
      *-reduced).
- [x] Reducido: `data-motion="reduced"`, sin `live`; el canvas queda arriba (no fijo); teja `--tile` →
      `--tile-active` al activarse, `:active` sin transform; el panel funciona igual.

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
