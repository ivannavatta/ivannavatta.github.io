import bridge.WorkerIO;
import java.io.PrintStream;
import java.io.UnsupportedEncodingException;

/**
 * Punto de entrada de la versión web del TPO (scripts/build-transporte.mjs compila desde acá).
 * Va en el paquete por defecto, como Main.
 *
 * Manda System.out y System.err a la terminal del navegador, corre Main.main sin cambios y avisa
 * al worker cómo terminó. La entrada la resuelve java.util.Scanner (TScanner), que pide cada línea
 * a WorkerIO.
 */
public class WebMain {
    public static void main(String[] args) throws UnsupportedEncodingException {
        // autoflush: println vacía el buffer en cada línea; print ("Opción: ") espera a readLine
        System.setOut(new PrintStream(new WorkerIO.Output(false), true, "UTF-8"));
        System.setErr(new PrintStream(new WorkerIO.Output(true), true, "UTF-8"));
        try {
            Main.main(args);
            System.out.flush();
            WorkerIO.finish();
        } catch (Throwable e) {
            System.out.flush();
            WorkerIO.fail(String.valueOf(e));
        }
    }
}
