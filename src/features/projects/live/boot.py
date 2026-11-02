# Arranque de "Probar en vivo": corre un programa de consola sin tocar su código.
#
# input() es bloqueante y en el navegador no se puede bloquear sin SharedArrayBuffer (GitHub Pages
# no permite las cabeceras COOP/COEP). Por eso se reescribe el AST: las funciones de nivel módulo
# pasan a `async def`, cada llamada a ellas y a input() se envuelve en `await`, y el módulo se
# compila con PyCF_ALLOW_TOP_LEVEL_AWAIT. input se inyecta en el namespace como una corrutina que
# escribe el prompt, hace flush y espera la línea que manda la interfaz.
import ast, sys

def _asyncify(src):
    tree = ast.parse(src, "main.py")
    names = {n.name for n in tree.body if isinstance(n, ast.FunctionDef)} | {"input"}

    class Awaiter(ast.NodeTransformer):
        def visit_Call(self, node):
            self.generic_visit(node)
            if isinstance(node.func, ast.Name) and node.func.id in names:
                return ast.copy_location(ast.Await(node), node)
            return node

    tree = Awaiter().visit(tree)
    tree.body = [
        ast.copy_location(ast.AsyncFunctionDef(**{f: getattr(n, f) for f in n._fields}), n)
        if isinstance(n, ast.FunctionDef) else n
        for n in tree.body
    ]
    ast.fix_missing_locations(tree)
    return compile(tree, "main.py", "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)

async def _run(src, ask):
    async def _input(prompt=""):
        sys.stdout.write(str(prompt))
        sys.stdout.flush()
        return str(await ask())
    ns = {"__name__": "__main__", "input": _input}
    coro = eval(_asyncify(src), ns)
    if coro is not None:
        await coro
    sys.stdout.flush()
