import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Content Security Policy del sitio publicado (GitHub Pages no permite cabeceras: va como <meta>).
// Solo en el build: en desarrollo Vite inyecta estilos y scripts en línea para el HMR.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob: https://res.cloudinary.com/dvcmgnvwi/",
  "font-src 'self'",
  "connect-src 'self' https://api.emailjs.com",
  "worker-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
].join('; ')

function contentSecurityPolicy() {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml() {
      return [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }]
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
