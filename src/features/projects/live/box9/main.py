#arrays
names = []
auto_performance = []
auto_potential = []

#valores validos para la performance y el potencial (escala del 1 al 5).
RATINGS = [1, 2, 3, 4, 5]

#pide un numero hasta que el usuario ingrese uno de los valores validos.
#si escribe letras o deja vacio, vuelve a preguntar en lugar de cortar el programa.
def ask_option(message, valid_options):
    while True:
        answer = input(message).strip()
        try:
            option = int(answer)
        except ValueError:
            option = None
        if option in valid_options:
            return option
        print(f"Valor invalido. Opciones validas: {', '.join(str(o) for o in valid_options)}")

#pide un nombre hasta que el usuario escriba algo (los espacios solos no cuentan).
def ask_name(message):
    name = input(message).strip()
    while name == "":
        name = input(message).strip()
    return name

#busca un empleado por nombre (sin importar mayusculas). devuelve su posicion o -1.
def find_employed(name):
    for i in range(len(names)):
        if names[i].lower() == name.lower():
            return i
    return -1

#funcion para agregar empleados, y califiquen su performance y su potencial de crecimiento.
def add_employed():
    employed = ask_name("Ingrese su nombre y apellido: ")
    if find_employed(employed) != -1:
        print(f"{employed} ya esta cargado. Use la opcion 3 para actualizar sus datos.")
        return
    performance = ask_option("Ingrese su performance dentro de la empresa (1 a 5): ", RATINGS)
    potential = ask_option("Ingrese su potencial de crecimiento dentro de la empresa (1 a 5): ", RATINGS)

    names.append(employed)
    auto_performance.append(performance)
    auto_potential.append(potential)

    print(f"{employed}, agregado correctamente")

#mostrar los empleados cargados.
def shows_employed():
    if names == []:
        print("No hay empleados cargados.")
    else:
        print("Empleados cargados:")
        for i in range(len(names)):
            print(f"{i+1}. {names[i]} | Auto-Performance: {auto_performance[i]}, Auto-Potencial: {auto_potential[i]}")
        print()

#funcion que sirve para que los empleados puedan actualizar sus datos
def update_data():
    employed = ask_name("Ingrese su nombre y apellido: ")
    i = find_employed(employed)
    if i == -1:
        print("Empleado no encontrado")
        return

    print(f"Nombre: {names[i]}")
    print(f"Auto-Performance: {auto_performance[i]}")
    print(f"Auto-Potencial: {auto_potential[i]}")

    update_all = ask_option("Desea actualizar todos los campos? (Si, presione 1. No, presione -1): ", [1, -1])
    if update_all == 1:
        auto_performance[i] = ask_option("Ingrese su nueva performance (1 a 5): ", RATINGS)
        auto_potential[i] = ask_option("Ingrese su nuevo potencial (1 a 5): ", RATINGS)
    else:
        field = ask_option("Desea actualizar su performance o su potencial? (Performance, 1. Potencial, 2): ", [1, 2])
        if field == 1:
            auto_performance[i] = ask_option("Ingrese su nueva performance (1 a 5): ", RATINGS)
        else:
            auto_potential[i] = ask_option("Ingrese su nuevo potencial (1 a 5): ", RATINGS)

    print(f"Datos de {names[i]} actualizados correctamente")

#calcula el puntaje de cada empleado (performance x potencial) y muestra el mejor.
def best_employee():
    if names == []:
        print("No hay empleados cargados.")
        return

    best_score = -1
    best_name = ""
    print("Puntajes:")
    for i in range(len(names)):
        score = auto_performance[i] * auto_potential[i]
        print(f"{names[i]} | Auto-Performance: {auto_performance[i]}, Auto-Potencial: {auto_potential[i]}, Puntaje: {score}")
        if score > best_score:
            best_score = score
            best_name = names[i]

    print(f"El mejor empleado es: {best_name} con un puntaje de {best_score}")

# funcion main que sirve como "menu" para que el usario elija que desea realizar.
def main():
    run = ask_option("Desea correr el programa? (Si, presione 1. No, presione -1): ", [1, -1])
    if run == -1:
        print("Fin del programa")
        return

    while True:
        print("Opcion 1, mostrar empleados")
        print("Opcion 2, agregar empleado")
        print("Opcion 3, actualizar datos")
        print("Opcion 4, mejor empleado")
        print("Opcion 5, salir")

        option = ask_option("Ingrese una opcion: ", [1, 2, 3, 4, 5])
        if option == 1:
            shows_employed()
        elif option == 2:
            add_employed()
        elif option == 3:
            update_data()
        elif option == 4:
            best_employee()
        else:
            print("Fin del programa")
            break


#ejecuta la funcion. con Ctrl+C se cierra sin mostrar el error de Python.
try:
    main()
except KeyboardInterrupt:
    print("\nFin del programa")
