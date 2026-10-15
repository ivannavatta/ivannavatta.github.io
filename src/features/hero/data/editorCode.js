import { profile } from '@/shared/data/profile'

/** Colores de sintaxis del bloque de código (tema claro, tipo GitHub Light). */
export const SYNTAX = {
  keyword: '#cf222e',
  variable: '#8250df',
  property: '#0550ae',
  string: '#0a3069',
  boolean: '#953800',
  punctuation: '#6e7781',
}

const k = (text) => ({ text, color: SYNTAX.keyword })
const v = (text) => ({ text, color: SYNTAX.variable })
const p = (text) => ({ text, color: SYNTAX.property })
const s = (text) => ({ text, color: SYNTAX.string })
const b = (text) => ({ text, color: SYNTAX.boolean })
const o = (text) => ({ text, color: SYNTAX.punctuation })

export const EDITOR_FILENAME = 'developer.js'

/** Código que se "tipea" en el editor del hero. Cada línea es una lista de tokens coloreados. */
export const editorCode = [
  [k('const '), v('developer'), o(' = {')],
  [p('  name'), o(': '), s(`'${profile.fullName}'`), o(',')],
  [p('  role'), o(': '), s(`'${profile.role.en}'`), o(',')],
  [p('  stack'), o(': ['), s("'React'"), o(', '), s("'Java'"), o(', '), s("'Python'"), o('],')],
  [p('  studies'), o(': '), s(`'${profile.university}'`), o(',')],
  [p('  available'), o(': '), b(String(profile.availableForWork)), o(',')],
  [o('};')],
]
