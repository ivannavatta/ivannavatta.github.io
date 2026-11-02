import { profile } from '@/shared/data/profile'

const GITHUB = profile.contact.github

/**
 * Los cuatro casos, en orden. La copia (problema, rol, stack, arquitectura) está en i18n/es.js;
 * acá van los datos estables: id, figura y links. Solo URLs constantes.
 * live: el caso tiene "Probar en vivo" (corre el programa real en el navegador, ver live/).
 */
export const PROJECTS = [
  {
    id: 'mytube',
    figure: 'layers',
    links: [
      { key: 'app', href: 'https://mytube-green.vercel.app' },
      { key: 'frontend', href: `${GITHUB}/mytube` },
      { key: 'backend', href: `${GITHUB}/mytube-backend` },
    ],
  },
  {
    id: 'transporte',
    figure: 'graph',
    // TODO: sumar el link al repositorio del TPO cuando sea público ({ key: 'repo', href: … })
    links: [],
  },
  {
    id: 'uadehub',
    figure: 'console',
    live: true,
    links: [{ key: 'repo', href: `${GITHUB}/uadeHUB` }],
  },
  {
    id: 'box9',
    figure: 'matrix',
    live: true,
    links: [{ key: 'repo', href: `${GITHUB}/box9` }],
  },
]
