import re
from functools import reduce
from datetime import datetime, timedelta

ARCHIVO_RESERVAS = "reservas.txt"
ARCHIVO_CLIENTES = "clientes.txt"

#FUNCIONES DE CARGA

def generar_fechas_disponibles():
    hoy = datetime.now()
    return [(hoy + timedelta(days=i)).strftime("%d-%m") for i in range(5)]

FECHAS_DISPONIBLES = generar_fechas_disponibles()

def login():
    print("=== Inicio de sesión en UADE Desk Finder ===")
    nombre = input("Nombre: ").strip()
    while not re.match(r"^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$", nombre):
        nombre = input("Solo letras y espacios, por favor: ").strip()

    legajo = input("Legajo (7 dígitos): ").strip()
    while not re.match(r"^\d{7}$", legajo):
        legajo = input("El legajo debe tener 7 dígitos. Volvé a ingresarlo: ").strip()

    usuario_encontrado = False

    try:
        with open(ARCHIVO_CLIENTES, "r", encoding="utf-8") as f:
            for linea in f:
                n, l = linea.strip().split("|")
                if l == legajo:
                    usuario_encontrado = True
                    if n.lower() != nombre.lower():
                        print(f"\nEl legajo {legajo} pertence a {n}, no a {nombre}.")
                        return None
                    print(f"\n¡Bienvenido de nuevo, {n}!")
                    break
    except FileNotFoundError:
        with open(ARCHIVO_CLIENTES, "w", encoding="utf-8"):
            pass

    if not usuario_encontrado:
        with open(ARCHIVO_CLIENTES, "a", encoding="utf-8") as f:
            f.write(f"{nombre}|{legajo}\n")
        print(f"\nCuenta creada para {nombre} (Legajo: {legajo}).")

    return {"nombre": nombre, "legajo": legajo, "reservas": []}


def guardar_reserva_global(piso, tipo, lugar, legajo, fecha):
    with open(ARCHIVO_RESERVAS, "a", encoding="utf-8") as f:
        f.write(f"{piso}|{tipo}|{lugar}|{legajo}|{fecha}\n")

def cargar_reservas_globales():
    reservas = []
    try:
        with open(ARCHIVO_RESERVAS, "r", encoding="utf-8") as f:
            for linea in f:
                p, t, l, leg, fch = linea.strip().split("|")
                reservas.append({
                    "piso": p,
                    "tipo": t,
                    "lugar": int(l),
                    "legajo": leg,
                    "fecha": fch
                })
    except FileNotFoundError:
        with open(ARCHIVO_RESERVAS, "w", encoding="utf-8"):
            pass
    return reservas



def cargar_pisos():
    pisos = []
    try:
        with open("pisos.txt", "r", encoding="utf-8") as f:
            lineas = [l.strip() for l in f if l.strip()]
    except IOError:
        print("No se encontró el archivo pisos.txt. Creá uno con la estructura adecuada.")
        return pisos

    piso_actual = {}
    tipo_actual = ""

    for linea in lineas:
        if linea == "---":
            pisos.append(piso_actual)
            piso_actual = {}
            tipo_actual = ""
        elif linea.startswith("[") and linea.endswith("]"):
            tipo_actual = linea[1:-1]
            piso_actual[tipo_actual] = []
        elif "=" in linea and not tipo_actual:
            clave, valor = linea.split("=", 1)
            piso_actual[clave.strip()] = valor.strip()
        elif "=" in linea and tipo_actual:
            datos = {}
            partes = linea.split(",")
            for parte in partes:
                if "=" in parte:
                    c, v = parte.split("=")
                    datos[c.strip()] = v.strip()
            datos["reservas"] = [] 
            piso_actual[tipo_actual].append(datos)

    reservas = cargar_reservas_globales()
    for r in reservas:
        for piso in pisos:
            if piso["nombre"] == r["piso"]:
                if r["tipo"] in piso and len(piso[r["tipo"]]) >= r["lugar"]:
                    piso[r["tipo"]][r["lugar"] - 1]["reservas"].append({
                        "legajo": r["legajo"],
                        "fecha": r["fecha"]
                    })
    return pisos

def ordenar_archivo_reservas():
    try:
        with open(ARCHIVO_RESERVAS, "r", encoding="utf-8") as f:
            lineas = f.readlines()

        if not lineas:
            print("El archivo está vacío. No hay nada para ordenar.")
            return

        matriz = [linea.strip().split("|") for linea in lineas]

        def extraer_fecha(fila):
            dia, mes = map(int, fila[-1].split("-"))
            return (mes, dia)

        matriz_ordenada = sorted(matriz, key=extraer_fecha)

        with open(ARCHIVO_RESERVAS, "w", encoding="utf-8") as f:
            for fila in matriz_ordenada:
                f.write("|".join(fila) + "\n")

        print("Archivo de reservas ordenado correctamente.")
    except FileNotFoundError:
        print("No se encontró el archivo de reservas.")



#FUNCIONES DE USUARIO



def ver_mis_reservas(usuario):
    legajo = usuario["legajo"]
    mis_reservas = []

    try:
        with open("reservas.txt", "r", encoding="utf-8") as f:
            for linea in f:
                piso, tipo, lugar, leg, fecha = linea.strip().split("|")
                if leg == legajo:
                    mis_reservas.append(
                        f"{piso} | {tipo} | Lugar {lugar} | Fecha {fecha}"
                    )
    except FileNotFoundError:
        open("reservas.txt", "w", encoding="utf-8").close()

    if not mis_reservas:
        print("\nNo tenés reservas activas.")
    else:
        print("\nTus reservas activas:")
        for i, r in enumerate(mis_reservas, start=1):
            print(f"{i}. {r}")


def reservarLugarPrivado(pisos, usuario):
    fechas_disponibles = FECHAS_DISPONIBLES

    print("\nPisos disponibles:")
    for i, piso_dict in enumerate(pisos, start=1):
        print(i, piso_dict['nombre'])

    piso_num = input("\n✶ Elegí el número del piso (0 para volver): ").strip()
    if piso_num == "0":
        return
    while not piso_num.isdigit() or int(piso_num) < 1 or int(piso_num) > len(pisos):
        piso_num = input("Número inválido, ingresá nuevamente (0 para volver): ").strip()
        if piso_num == "0":
            return
    piso = pisos[int(piso_num) - 1]

    tipos = [t for t in piso if t not in ["nombre", "tipo", "descripcion"]]
    print("\nTipos de lugar disponibles:")
    for i, t in enumerate(tipos, start=1):
        print(i, t)

    tipo_num = input("\n✶ Elegí el tipo de lugar (0 para volver): ").strip()
    if tipo_num == "0":
        return
    while not tipo_num.isdigit() or int(tipo_num) < 1 or int(tipo_num) > len(tipos):
        tipo_num = input("Número inválido, ingresá nuevamente (0 para volver): ").strip()
        if tipo_num == "0":
            return
    tipo = tipos[int(tipo_num) - 1]
    lugares = piso[tipo]

    print("\nFechas disponibles:")
    for i, fecha in enumerate(fechas_disponibles, start=1):
        print(f"{i}. {fecha}")

    fecha_num = input("\n✶ Elegí una fecha (0 para volver): ").strip()
    if fecha_num == "0":
        return
    while not fecha_num.isdigit() or int(fecha_num) < 1 or int(fecha_num) > len(fechas_disponibles):
        fecha_num = input("Número inválido. Ingresá nuevamente (0 para volver): ").strip()
        if fecha_num == "0":
            return
    fecha = fechas_disponibles[int(fecha_num) - 1]

    reservas_globales = cargar_reservas_globales()

    print(f"\n=== Lugares disponibles en {piso['nombre']} ({tipo}) para el {fecha} ===")
    libres = []
    for i, l in enumerate(lugares, start=1):

        reservado = False
        for r in reservas_globales:
            if (
                r["piso"] == piso["nombre"] and
                r["tipo"] == tipo and
                r["lugar"] == i and
                r.get("fecha") == fecha
            ):
                reservado = True
                break

        estado = "❌ Ocupado" if reservado else "✅ Libre"

        atributos = []
        if l.get("enchufe") == "True":
            atributos.append("Enchufe")
        if l.get("pizarron") == "True":
            atributos.append("Pizarrón")

        attr_text = f"  ({', '.join(atributos)})" if atributos else ""
        print(f"Lugar {i}: {estado}{attr_text}")

        if not reservado:
            libres.append(i)

    if not libres:
        print("\nNo hay lugares libres para esa fecha.")
        return

    lugar_num = input("\n✶ Elegí el número del lugar que querés reservar (0 para volver): ").strip()
    if lugar_num == "0":
        return
    while not lugar_num.isdigit() or int(lugar_num) not in libres:
        lugar_num = input("Número inválido o lugar ocupado. Probá de nuevo (0 para volver): ").strip()
        if lugar_num == "0":
            return
    lugar_num = int(lugar_num)

    texto_reserva = f"{piso['nombre']} | {tipo} | Lugar {lugar_num} | Fecha {fecha}"
    usuario["reservas"].append(texto_reserva)

    guardar_reserva_global(
        piso=piso["nombre"],
        tipo=tipo,
        lugar=lugar_num,
        legajo=usuario["legajo"],
        fecha=fecha
    )

    print(f"\n¡Listo {usuario['nombre']}! Reservaste el {texto_reserva}.\n")

    while True:
        opcion = input("¿Querés hacer otra reserva? (s/n): ").strip().lower()
        if opcion == "s":
            reservarLugarPrivado(pisos, usuario)
            break
        elif opcion == "n":
            print("\nGracias por usar UADE Desk Finder. ¡Hasta pronto!\n")
            break
        else:
            print("Opción inválida, escribí 's' o 'n'.")



def liberarLugarPrivado(usuario):
    legajo = usuario["legajo"]
    reservas_usuario = []

    with open("reservas.txt", "r", encoding="utf-8") as f:
        lineas = f.readlines()

    for linea in lineas:
        piso, tipo, lugar, leg, fecha = linea.strip().split("|")
        if leg == legajo:
            reservas_usuario.append((linea, f"{piso} | {tipo} | Lugar {lugar} | Fecha {fecha}"))

    if not reservas_usuario:
        print("No tenés reservas para liberar.")
        return

    print("\nTus reservas:")
    for i, (_, texto) in enumerate(reservas_usuario, 1):
        print(f"{i}. {texto}")

    while True:
        opcion = input("Elegí cuál querés liberar (número) o 0 para volver: ")
        if opcion == "0":
            return
        if opcion.isdigit() and 1 <= int(opcion) <= len(reservas_usuario):
            break
        print("Opción inválida.")

    linea_a_borrar = reservas_usuario[int(opcion) - 1][0]

    with open("reservas.txt", "w", encoding="utf-8") as f:
        for linea in lineas:
            if linea != linea_a_borrar:
                f.write(linea)

    print("Reserva cancelada con éxito.")

    print(f"\nReserva liberada! \n")
    while True:
        opcion = input("¿Querés liberar otra reserva? (s/n): ").strip().lower()
        if opcion == "s":
            liberarLugarPrivado(usuario)
            break
        elif opcion == "n":
            print("\nGracias por usar UADE Desk Finder. ¡Hasta pronto!\n")
            break
        else:
            print("Opción inválida, escribí 's' o 'n'.")




def consultaTotal():
    fechas_disponibles = FECHAS_DISPONIBLES
    pisos = cargar_pisos()
    print("\n=== Consulta total de lugares libres ===")
    print("Fechas disponibles:")
    for i, f in enumerate(fechas_disponibles, start=1):
        print(f"{i}. {f}")

    seleccion = input("\nElegí una fecha: ").strip()
    while not seleccion.isdigit() or int(seleccion) < 1 or int(seleccion) > len(fechas_disponibles):
        seleccion = input("Número inválido, probá nuevamente: ")

    fecha = fechas_disponibles[int(seleccion) - 1]

    print(f"\n=== Lugares libres para el {fecha} ===")

    for piso in pisos:

        total_libres = sum(
            map(
                lambda l: 1 if fecha not in [r["fecha"] for r in l["reservas"]] else 0,
                (
                    lugar
                    for clave in piso
                    if clave not in ["nombre", "tipo", "descripcion"]
                    for lugar in piso[clave]
                )
            )
        )

        print(f"{piso['nombre']}: {total_libres} libres")
    while True:
        opcion = input("¿Querés hacer otra consulta? (s/n): ").strip().lower()
        if opcion == "s":
            consultaTotal()
            break
        elif opcion == "n":
            print("\nGracias por usar UADE Desk Finder. ¡Hasta pronto!\n")
            break
        else:
            print("Opción inválida, escribí 's' o 'n'.")

def consultarDisponibilidad(pisos):
    fechas_disponibles = FECHAS_DISPONIBLES

    print("\nPisos disponibles:")
    for i, piso_dict in enumerate(pisos, start=1):
        print(f"{i}. {piso_dict['nombre']}")

    seleccion_piso = input("\nElegí un piso: ").strip()
    while not seleccion_piso.isdigit() or int(seleccion_piso) < 1 or int(seleccion_piso) > len(pisos):
        seleccion_piso = input("Número inválido. Probá de nuevo: ").strip()

    piso = pisos[int(seleccion_piso) - 1]

    print("\nFechas disponibles:")
    for i, f in enumerate(fechas_disponibles, start=1):
        print(f"{i}. {f}")

    seleccion_fecha = input("\nElegí una fecha: ").strip()
    while not seleccion_fecha.isdigit() or int(seleccion_fecha) < 1 or int(seleccion_fecha) > len(fechas_disponibles):
        seleccion_fecha = input("Número inválido. Probá nuevamente: ").strip()

    fecha = fechas_disponibles[int(seleccion_fecha) - 1]

    print(f"\n=== Disponibilidad en {piso['nombre']} para el {fecha} ===")

    reservas_globales = cargar_reservas_globales()

    for clave in piso:
        if clave not in ["nombre", "tipo", "descripcion"]:
            print(f"\nTipo: {clave}")
            lugares = piso[clave]
            for i, l in enumerate(lugares, start=1):

                reservado = False
                for r in reservas_globales:
                    if (
                        r["piso"] == piso["nombre"]
                        and r["tipo"] == clave
                        and r["lugar"] == i
                        and r["fecha"] == fecha
                    ):
                        reservado = True
                        break

                estado = "❌ Ocupado" if reservado else "✅ Libre"

                atributos = []
                if l.get("enchufe") == "True":
                    atributos.append("Enchufe")
                if l.get("pizarron") == "True":
                    atributos.append("Pizarrón")
                attr_txt = f" ({', '.join(atributos)})" if atributos else ""

                print(f"  Lugar {i}: {estado}{attr_txt}")
    while True:
        opcion = input("¿Querés hacer otra consulta? (s/n): ").strip().lower()
        if opcion == "s":
            consultarDisponibilidad(pisos)
            break
        elif opcion == "n":
            print("\nGracias por usar UADE Desk Finder. ¡Hasta pronto!\n")
            break
        else:
            print("Opción inválida, escribí 's' o 'n'.")



def obtenerFechasConAltaDemanda(min_reservas):
    while True:
        reservas = cargar_reservas_globales()
        fechas = set(r["fecha"] for r in reservas)

        print("\n=== Fechas con alta demanda ===")
        encontro = False

        for fecha in fechas:
            cantidad = len(list(filter(lambda r: r["fecha"] == fecha, reservas)))
            if cantidad >= min_reservas:
                print(f"- {fecha}: {cantidad} reservas")
                encontro = True

        if not encontro:
            print("No hay fechas con esa cantidad mínima de reservas.")

        opcion = input("\n¿Querés hacer otra consulta? (s/n): ").strip().lower()
        if opcion == "s":

            while True:
                buscada = input("Ingrese la cantidad de reservas mínimas a buscar: ").strip()
                if buscada.isdigit():
                    min_reservas = int(buscada)
                    break
                else:
                    print("Ingresá un número válido.")

        elif opcion == "n":
            print("\nGracias por usar UADE Desk Finder. ¡Hasta pronto!\n")
            break
        else:
            print("Opción inválida, escribí 's' o 'n'.")



 
def mostrarPorcentajes(pisos):
    fechas_disponibles = FECHAS_DISPONIBLES
    print("\nFechas disponibles:")
    for i, f in enumerate(fechas_disponibles, start=1):
        print(f"{i}. {f}")
    seleccion = input("\nElegí una fecha: ").strip()
    while not seleccion.isdigit() or int(seleccion) < 1 or int(seleccion) > len(fechas_disponibles):
        seleccion = input("Número inválido, probá nuevamente: ").strip()
    fecha = fechas_disponibles[int(seleccion) - 1]
    reservas = cargar_reservas_globales()
    ocupaciones = {}

    for piso in pisos:
        total_lugares = 0
        ocupados = 0

        for clave in piso:
            if clave not in ["nombre", "tipo", "descripcion"]:
                lista = piso[clave]
                for i, _ in enumerate(lista, start=1):
                    total_lugares += 1
                    reservado = False

                    for r in reservas:
                        if r["piso"] == piso["nombre"] and r["tipo"] == clave and r["lugar"] == i and r["fecha"] == fecha:
                            reservado = True
                            break

                    if reservado:
                        ocupados += 1
        porcentaje = (ocupados / total_lugares * 100) if total_lugares > 0 else 0
        ocupaciones[piso["nombre"]] = porcentaje
        print(f"{piso['nombre']}: {porcentaje:.2f}% ocupación")

    if ocupaciones:
        max_ocupacion = -1
        piso_mas_ocupado = ""
        for nombre, porcentaje in ocupaciones.items():
            if porcentaje > max_ocupacion:
                max_ocupacion = porcentaje
                piso_mas_ocupado = nombre

        print(f"\nPiso más ocupado: {piso_mas_ocupado} ({max_ocupacion:.2f}% ocupación)")
    while True:
        opcion = input("¿Querés hacer otra consulta? (s/n): ").strip().lower()
        if opcion == "s":
            mostrarPorcentajes(pisos)
            break
        elif opcion == "n":
            print("\nGracias por usar UADE Desk Finder. ¡Hasta pronto!\n")
            break
        else:
            print("Opción inválida, escribí 's' o 'n'.")


def estadisticasGlobales(pisos):
    print("\n=== Estadísticas globales de UADE Desk Finder ===")
    print("Fechas disponibles:")
    for i, f in enumerate(FECHAS_DISPONIBLES, start=1):
        print(f"{i}. {f}")

    sel = input("\nElegí una fecha: ").strip()
    while not sel.isdigit() or int(sel) < 1 or int(sel) > len(FECHAS_DISPONIBLES):
        sel = input("Número inválido, probá nuevamente: ").strip()

    fecha = FECHAS_DISPONIBLES[int(sel) - 1]
    reservas = cargar_reservas_globales()

    todos = [
        (piso["nombre"], tipo, i + 1)
        for piso in pisos
        for tipo in piso
        if tipo not in ["nombre", "tipo", "descripcion"]
        for i in range(len(piso[tipo]))
    ]

    total = len(todos)

    ocupados = reduce(
        lambda acc, t: acc + sum(
            1
            for r in reservas
            if r["piso"] == t[0] and r["tipo"] == t[1] and r["lugar"] == t[2] and r["fecha"] == fecha
        ),
        todos,
        0
    )

    libres = total - ocupados
    porc = (ocupados * 100) / total if total != 0 else 0

    print("\n=== Resultados globales ===")
    print("Total de lugares:", total)
    print("Lugares ocupados:", ocupados)
    print("Lugares libres:  ", libres)
    print(f"Porcentaje de ocupación total: {porc:.2f}%\n")



def filtrarPorAtributoSimple(pisos):
    atributos = ("enchufe", "pizarron")
    print("\nAtributos disponibles:")
    i = 1
    for atributo in atributos:
        print(f'    {i}. {atributo}')
        i += 1
    print(f'    {0}. Mostrar todos')

    opcion = input("\nElegí un atributo por número: ").strip()
    atributo_seleccionado = ""
    if opcion == "1":
        atributo_seleccionado = "enchufe"
    elif opcion == "2":
        atributo_seleccionado = "pizarron"

    fechas_disponibles = FECHAS_DISPONIBLES
    print("\nFechas disponibles:")
    for i, f in enumerate(fechas_disponibles, start=1):
        print(f"{i}. {f}")

    seleccion = input("\nElegí una fecha: ").strip()
    while not seleccion.isdigit() or int(seleccion) < 1 or int(seleccion) > len(fechas_disponibles):
        seleccion = input("Número inválido, probá nuevamente: ").strip()

    fecha = fechas_disponibles[int(seleccion) - 1]
    reservas = cargar_reservas_globales()

    resultados = {}
    for piso in pisos:
        nombre_piso = piso["nombre"]
        resultados[nombre_piso] = {}

        for clave in piso:
            if clave not in ["nombre", "tipo", "descripcion"]:
                lugares = piso[clave]

                libres = []
                j = 0
                while j < len(lugares):
                    lugar = lugares[j]
                    ocupado = False
                    for r in reservas:
                        if r["piso"] == nombre_piso and r["tipo"] == clave and r["lugar"] == j + 1 and r["fecha"] == fecha:
                            ocupado = True
                            break
                    if not ocupado:
                        if atributo_seleccionado == "" or lugar.get(atributo_seleccionado) == "True":
                            libres.append(j + 1)
                    j += 1

                resultados[nombre_piso][clave] = libres

    hay_algo = False
    for piso in resultados:
        for tipo in resultados[piso]:
            if len(resultados[piso][tipo]) > 0:
                hay_algo = True
                break

    if hay_algo:
        if atributo_seleccionado != "":
            print("\nLugares con " + atributo_seleccionado + " disponibles en:")
        else:
            print("\nTodos los lugares libres disponibles en:")

        print("Fecha seleccionada:", fecha)
        for piso in resultados:
            print("-------------------------------------------------------------------")
            print("Piso: " + piso)
            for tipo in resultados[piso]:
                print("  Tipo: " + tipo)
                print("    Lugares: ", end="")
                for lugar in resultados[piso][tipo]:
                    print(str(lugar), end="  ")
                print()
        print("-------------------------------------------------------------------")
    else:
        print("\nNo se encontraron lugares libres con ese atributo para esa fecha.")

    input("\nPresione enter para volver al menú principal...")
    while True:
        opcion = input("¿Querés hacer otra consulta? (s/n): ").strip().lower()
        if opcion == "s":
            filtrarPorAtributoSimple(pisos)
            break
        elif opcion == "n":
            print("\nGracias por usar UADE Desk Finder. ¡Hasta pronto!\n")
            break
        else:
            print("Opción inválida, escribí 's' o 'n'.")



def analisisUsuarios(pisos):
    clave_admin = input("Ingresá la contraseña de administrador: ").strip()
    if clave_admin != "uade":
        print("Contraseña incorrecta.")
        return

    try:
        with open("reservas.txt", "r", encoding="utf-8") as f:
            lineas = [l.strip() for l in f if l.strip()]
    except FileNotFoundError:
        print("No existe reservas.txt")
        return

    try:
        with open("clientes.txt", "r", encoding="utf-8") as f:
            clientes = {}
            for l in f:
                partes = l.strip().split("|")
                if len(partes) == 2:
                    nombre, legajo = partes
                    clientes[legajo.strip()] = nombre.strip()
    except FileNotFoundError:
        print("No existe clientes.txt")
        return

    usuarios_por_piso = []
    for piso in pisos:
        usuarios = set()
        for linea in lineas:
            partes = linea.split("|")
            if len(partes) < 5:
                continue
            nombre_piso = partes[0].strip()
            tipo, lugar, legajo, fecha = partes[1:5]
            legajo = legajo.strip()
            nombre = clientes.get(legajo, "Desconocido")
            usuario = f"{nombre} ({legajo})"
            if nombre_piso == piso["nombre"]:
                usuarios.add(usuario)
        usuarios_por_piso.append(usuarios)

    if not usuarios_por_piso:
        print("No hay pisos para analizar.")
        return

    union_usuarios = set.union(*usuarios_por_piso)
    interseccion_usuarios = set.intersection(*usuarios_por_piso)
    diferencia_usuarios = usuarios_por_piso[0].difference(*usuarios_por_piso[1:])

    print("\n=== Análisis de Usuarios ===\n")
    print("Usuarios en cualquier piso:")
    print(", ".join(sorted(union_usuarios)) if union_usuarios else "Ninguno")

    print("\nUsuarios que reservaron en más de un piso:")
    
    varios_pisos = {u for u in union_usuarios if sum(u in piso for piso in usuarios_por_piso) > 1}
    print(", ".join(sorted(varios_pisos)) if varios_pisos else "Ninguno")

    print(f"\nUsuarios solo en {pisos[0]['nombre']}:")
    print(", ".join(sorted(diferencia_usuarios)) if diferencia_usuarios else "Ninguno")





def menuUsuario(pisos, usuario):
    while True:
        print("\n=== Menú de Usuario ===")
        print("1. Ver mis reservas")
        print("2. Reservar un nuevo lugar")
        print("3. Liberar una reserva")
        print("4. Consulta total de lugares libres(Vista numerica)")
        print("5. Consultar disponibilidad por piso")
        print("6. Consultar fechas demandadas")
        print("7. Mostrar porcentajes de ocupación por edificio")
        print("8. Filtrar lugares libres por atributo")
        print("9. Ver estadísticas globales de un dia")
        print("10. Análisis de usuarios")
        print("0. Salir")
        op = input("\n✶ Elegí una opción: ").strip()
        if op == "1":
            ver_mis_reservas(usuario)
        elif op == "2":
            reservarLugarPrivado(pisos, usuario)
        elif op == "3":
            liberarLugarPrivado(usuario)
        elif op == "4":
            consultaTotal()
        elif op == "5":
            consultarDisponibilidad(pisos)
        elif op == "6":
            while True:
                buscada = input("Ingrese la cantidad de reservas mínimas a buscar: ").strip()
                if buscada.isdigit():
                    buscada = int(buscada)
                    break
                else:
                    print("Ingresá un número válido.")

            obtenerFechasConAltaDemanda(buscada)
        elif op == "7":
            mostrarPorcentajes(pisos)
        elif op == "8":
            filtrarPorAtributoSimple(pisos)
        elif op == "9":
            estadisticasGlobales(pisos)
        elif op == "10":
            analisisUsuarios(pisos)
        elif op == "0":
            ordenar_archivo_reservas()
            print("\n¡Hasta pronto!")
            break
        else:
            print("Opción inválida, intentá de nuevo.")

pisos = cargar_pisos()
if not pisos:
    print("No se pudieron cargar pisos. Cerrando programa.")
else:
    usuario = login()
    if usuario is not None:
        menuUsuario(pisos, usuario)
    else:
        print("\nInicio de sesión cancelado por seguridad.\n")
