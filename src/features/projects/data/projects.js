import { profile } from '@/shared/data/profile'

const GITHUB = profile.contact.github

/**
 * Los cuatro casos, en orden. La copia (problema, rol, stack, arquitectura) está en i18n/es.js;
 * acá van los datos estables: id, figura y repositorios. Solo URLs constantes.
 * MyTube no enlaza el deploy (hoy no coincide con el proyecto descripto).
 */
export const PROJECTS = [
  {
    id: 'mytube',
    figure: 'layers',
    links: [
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
    links: [{ key: 'repo', href: `${GITHUB}/uadeHUB` }],
  },
  {
    id: 'box9',
    figure: 'matrix',
    links: [{ key: 'repo', href: `${GITHUB}/box9` }],
  },
]
