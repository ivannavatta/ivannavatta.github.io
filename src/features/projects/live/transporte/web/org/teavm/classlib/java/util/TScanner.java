package org.teavm.classlib.java.util;

import bridge.WorkerIO;
import java.io.InputStream;

/**
 * java.util.Scanner para la versión web. TeaVM no trae Scanner en su biblioteca de clases ni
 * permite System.setIn, así que sin esta clase Main.java no compila.
 *
 * TeaVM toma las clases de org.teavm.classlib.java.* con prefijo T como si fueran las de java.*:
 * esta TScanner reemplaza a java.util.Scanner y Main.java queda exactamente como en el TPO.
 * Implementa solo lo que usa el programa: el constructor con System.in y nextLine(), que pide la
 * línea a la terminal del navegador.
 */
public class TScanner {
    public TScanner(InputStream in) {
        // La entrada siempre viene de la terminal web: el InputStream no se usa
    }

    public String nextLine() {
        return WorkerIO.readLine();
    }

    public void close() {
    }
}
