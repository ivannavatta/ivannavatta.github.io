export const projects = {
  title: 'Proyectos',
  intro:
    'Cuatro sistemas: una plataforma de videos full stack, un trabajo de estructuras de datos en Java y dos herramientas en Python para la facultad.',
  facts: { problem: 'Problema', role: 'Rol', stack: 'Stack' },
  more: 'Ver arquitectura',
  live: 'Probar en vivo',
  less: 'Ver resumen',
  architecture: 'Arquitectura',
  decisions: 'Decisiones',
  newTab: '(se abre en otra pestaña)',
  links: {
    frontend: 'Repositorio frontend',
    backend: 'Repositorio backend',
    repo: 'Repositorio',
    app: 'App en vivo',
  },
}

export const cases = {
  mytube: {
    title: 'MyTube',
    meta: '2024 · Plataforma de videos full stack',
    problem: 'Subir y ver videos con cuentas propias: autenticación, archivos pesados y una interfaz que pueda crecer.',
    role: 'Desarrollo completo: frontend, backend, base de datos y deploy.',
    stack:
      'React 18, TypeScript, MUI, React-Bootstrap, React Router, Express, MongoDB, Mongoose, bcrypt, Cloudflare R2, Vercel',
    architecture:
      'El frontend separa dominio, contexto, servicios externos y la capa de React. El backend sigue controllers, services y useCases, con DAO y DTO sobre Mongoose.',
    decisions: [
      'Contraseñas guardadas como hash con bcrypt.',
      'El backend firma una URL y el navegador sube el video directo a Cloudflare R2: el archivo no pasa por Vercel, que limita cada pedido a 4,5 MB. Después, MongoDB guarda sus datos.',
      'DAO y DTO para cambiar la persistencia sin tocar la lógica.',
    ],
    figure: {
      frontend: 'Frontend · React + TypeScript',
      frontendLayers: ['frameworks-ui', 'external services', 'context', 'domain'],
      link: 'HTTP + JSON',
      backend: 'Backend · Express + TypeScript',
      backendLayers: ['controllers', 'services', 'useCases', 'DAO · DTO'],
      stores: ['MongoDB', 'Cloudflare R2'],
      caption: 'Capas del frontend y del backend, de la interfaz a los datos.',
    },
  },
  transporte: {
    title: 'Sistema de transporte',
    meta: '2025 · Java · Programación II, UADE',
    problem: 'Gestionar terminales, rutas, micros y viajes, y encontrar recorridos posibles con un máximo de paradas.',
    role: 'Trabajo práctico obligatorio: diseño e implementación de las estructuras y los módulos.',
    stack:
      'Java, TDA propios: grafo, árbol binario, cola de prioridad, cola, pila, conjunto, lista enlazada, diccionario simple y múltiple',
    architecture:
      'Cinco módulos sobre TDA propios: planificación de rutas, gestión de flota, prioridad de viajes, análisis de conexiones y reportes.',
    decisions: [
      'Terminales y rutas viven en un grafo; buscar recorridos es recorrerlo con un tope de paradas.',
      'Los viajes se ordenan con una cola de prioridad.',
      'El análisis de conexiones detecta terminales desconectadas.',
      'Excepciones propias para cada error del dominio.',
    ],
    figure: {
      title:
        'Grafo de siete terminales conectadas y una suelta; resaltada, una ruta de A a G con dos paradas intermedias.',
      offline: 'sin conexión',
      caption: 'Ruta de A a G con un tope de tres tramos; la terminal sin conexiones queda afuera.',
    },
  },
  uadehub: {
    title: 'uadeHUB',
    meta: 'Sep. 2025 – hoy · Python · UADE Desk Finder',
    problem:
      'Saber si hay lugar para estudiar en la facultad antes de ir: reservar y liberar lugares por piso, tipo y fecha, en los próximos cinco días.',
    role: 'Desarrollo del sistema de consola: acceso, reservas, persistencia y reportes.',
    stack: 'Python, expresiones regulares, persistencia en archivos',
    architecture:
      'Un programa de consola con menús por piso, tipo de lugar y fecha. Los pisos y las reservas se leen y se guardan en archivos de texto.',
    decisions: [
      'Acceso con nombre y legajo de 7 dígitos, validados con expresiones regulares.',
      'Reservas limitadas a los próximos cinco días.',
      'Reportes de fechas con alta demanda y porcentaje de ocupación por piso.',
    ],
    figure: {
      // Textos reales del programa; el legajo (marcado) es un ejemplo inválido
      before: '=== Inicio de sesión en UADE Desk Finder ===\nNombre: Ivan\nLegajo (7 dígitos): ',
      example: '12345',
      after:
        '\nEl legajo debe tener 7 dígitos. Volvé a ingresarlo: _\n\nPisos disponibles:\n1 Piso 10-Uade Comunitario\n2 Piso 10-UADEHUB\n3 Piso Silencioso\n\nElegí un piso: _',
      caption: 'Textos reales del programa; el legajo es un ejemplo inválido.',
    },
    // "Probar en vivo": el main.py real, con Python 3.14 (Pyodide) en un Web Worker
    live: {
      label: 'uadeHUB en vivo',
      status: {
        loading: 'Python 3.14 en tu navegador',
        running: 'Python 3.14 en tu navegador · ejecutando main.py',
        done: 'Programa finalizado · Reiniciar para volver a empezar',
        error: 'El programa terminó con un error',
        bootError: 'Error al cargar',
      },
      restart: 'Reiniciar',
      close: 'Cerrar',
      retry: 'Reintentar',
      loading: 'Descargando Python (≈ 6 MB, solo la primera vez)…',
      bootError: 'No se pudo cargar Python. Revisá tu conexión y volvé a intentar.',
      output: 'Salida del programa',
      answer: 'Tu respuesta',
      finished: '[Programa finalizado]',
      hints: [
        { text: 'Escribí y apretá', key: 'Enter' },
        { text: 'Legajo: 7 dígitos' },
        { text: 'Contraseña de admin:', key: 'uade' },
        { text: 'Los datos viven en tu navegador y se borran al reiniciar' },
      ],
    },
  },
  box9: {
    title: 'box9',
    meta: '2025 · Python · UADE',
    problem: 'Llevar a una aplicación la matriz 9-box con la que las empresas cruzan desempeño y potencial de sus empleados.',
    role: 'Proyecto para la facultad: carga, actualización y evaluación de empleados por consola.',
    stack: 'Python',
    architecture:
      'Un programa de consola con un menú de cinco opciones: cargar resultados, agregar empleado, actualizar datos, ver el mejor empleado y salir.',
    decisions: [
      'Autoevaluación de desempeño y potencial en escala de 1 a 5.',
      'La calificación de la empresa se suma a la autoevaluación.',
      'Cada empleado puede actualizar un campo o los dos.',
    ],
    figure: {
      y: 'Potencial',
      x: 'Desempeño',
      label:
        'Matriz de tres por tres: desempeño en el eje horizontal y potencial en el vertical. Marcada, la celda de desempeño alto y potencial alto.',
      mark: '4 · 5',
      caption: 'Ejemplo: autoevaluación con desempeño 4 y potencial 5, en escala de 1 a 5.',
    },
  },
}
