import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyMotionClass } from '@/shared/scroll'
import '@/shared/styles/globals.css'
import { App } from './App'

// Antes del primer render: el CSS ya sabe si hay movimiento reducido
applyMotionClass()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
