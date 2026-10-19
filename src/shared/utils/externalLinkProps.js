/** Props para links externos: se abren en otra pestaña y sin acceso a `window.opener`. */
export function externalLinkProps(href) {
  return href?.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}
