package bridge;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import org.teavm.interop.Async;
import org.teavm.interop.AsyncCallback;
import org.teavm.jso.JSBody;
import org.teavm.jso.JSFunctor;
import org.teavm.jso.JSObject;

/**
 * Puente entre el programa Java (compilado a JavaScript con TeaVM) y el Web Worker que lo corre.
 * No es parte del TPO: existe solo para la versión web de "Probar en vivo".
 *
 * En el navegador no hay consola: la entrada y la salida pasan por funciones globales que
 * transporte.worker.js define antes de llamar a main(): requestLine, writeOut, writeErr, finish
 * y fail. Este archivo es el único lugar del lado Java que las conoce.
 */
public final class WorkerIO {
    private WorkerIO() {
    }

    /**
     * Pide una línea a la terminal y espera la respuesta. Antes vacía System.out y System.err, así
     * la pregunta ("Opción: ") ya está en pantalla cuando aparece el cursor.
     *
     * Para Main.java es una llamada bloqueante, como Scanner.nextLine() en la JVM. TeaVM la
     * convierte en una espera asincrónica (@Async): el worker queda libre mientras el usuario escribe.
     */
    public static String readLine() {
        System.out.flush();
        System.err.flush();
        return awaitLine();
    }

    @Async
    private static native String awaitLine();

    // Implementación de awaitLine para TeaVM: termina cuando la interfaz manda la línea
    private static void awaitLine(AsyncCallback<String> callback) {
        requestLine(callback::complete);
    }

    /** La función que recibe requestLine: el worker la llama con el texto que escribió el usuario. */
    @JSFunctor
    interface LineCallback extends JSObject {
        void accept(String line);
    }

    /**
     * Destino de System.out y System.err: junta los bytes y, en cada flush, los manda al worker como
     * texto UTF-8 (así los acentos de los menús llegan enteros, aunque un carácter ocupe dos bytes).
     */
    public static final class Output extends OutputStream {
        private final ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        private final boolean err;

        public Output(boolean err) {
            this.err = err;
        }

        @Override
        public void write(int b) {
            bytes.write(b);
        }

        @Override
        public void write(byte[] b, int off, int len) {
            bytes.write(b, off, len);
        }

        @Override
        public void flush() {
            if (bytes.size() == 0) return;
            String text = new String(bytes.toByteArray(), StandardCharsets.UTF_8);
            bytes.reset();
            if (err) writeErr(text);
            else writeOut(text);
        }
    }

    @JSBody(params = "callback", script = "requestLine(callback);")
    private static native void requestLine(LineCallback callback);

    @JSBody(params = "text", script = "writeOut(text);")
    private static native void writeOut(String text);

    @JSBody(params = "text", script = "writeErr(text);")
    private static native void writeErr(String text);

    /** Main.main volvió ("0. Salir del Sistema"). */
    @JSBody(script = "finish();")
    public static native void finish();

    /** Main.main terminó con una excepción que el programa no atrapó. */
    @JSBody(params = "message", script = "fail(message);")
    public static native void fail(String message);
}
