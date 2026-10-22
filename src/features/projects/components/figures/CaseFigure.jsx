import { ConsoleFigure } from './ConsoleFigure'
import { GraphFigure } from './GraphFigure'
import { LayersFigure } from './LayersFigure'
import { MatrixFigure } from './MatrixFigure'

const FIGURES = { layers: LayersFigure, graph: GraphFigure, console: ConsoleFigure, matrix: MatrixFigure }

export function CaseFigure({ kind, copy, id }) {
  const Figure = FIGURES[kind]
  return Figure ? <Figure copy={copy} id={id} /> : null
}
