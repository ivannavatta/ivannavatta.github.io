const CLOUDINARY = 'https://res.cloudinary.com/dvcmgnvwi/image/upload'

/**
 * Cursos y certificaciones.
 * `image` es la imagen del certificado completo; la miniatura se genera con Cloudinary.
 * `badge` (opcional) muestra una distinción, por ejemplo "Top 10".
 * Vive en shared porque la usan dos features: education (tarjetas) y about (contador).
 */
export const certifications = [
  {
    id: 'backend',
    title: { es: 'Programación Backend', en: 'Backend Programming' },
    issuer: 'Coderhouse',
    date: '2024-05-08',
    hours: 94,
    weeks: 24,
    image: `${CLOUDINARY}/v1781194510/666c75e7f3c3dc36a7cf99fb_bxxcuf.png`,
  },
  {
    id: 'react',
    title: { es: 'React Js', en: 'React Js' },
    issuer: 'Coderhouse',
    date: '2023-10-18',
    hours: 30,
    weeks: 8,
    badge: 'Top 10',
    image: `${CLOUDINARY}/v1781194502/654d70b4e95cb74ce8256eb0_dnkxup.png`,
  },
  {
    id: 'javascript',
    title: { es: 'JavaScript', en: 'JavaScript' },
    issuer: 'Coderhouse',
    date: '2023-08-23',
    hours: 34,
    weeks: 9,
    image: `${CLOUDINARY}/v1781194516/6508e129e71b752e0898db68_fth7lp.png`,
  },
  {
    id: 'web',
    title: { es: 'Desarrollo Web', en: 'Web Development' },
    issuer: 'Coderhouse',
    date: '2023-06-14',
    hours: 38,
    weeks: 10,
    image: `${CLOUDINARY}/v1781194450/649dd35c04eaf80002b0a201_jel5rh.png`,
  },
]

/** Miniatura optimizada (Cloudinary redimensiona y convierte a webp/avif automáticamente). */
export const thumbnail = (url, width = 640) => url.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`)
