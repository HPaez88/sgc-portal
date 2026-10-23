import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { SGCProvider } from './SGCContext.jsx'
import { ToastProvider } from './components/common/Toast.jsx'
import AvisoActualizacion from './components/common/AvisoActualizacion.jsx'

// Instalable como app (PWA). Solo en producción para no interferir con el servidor de desarrollo.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <SGCProvider>
        <App />
        <AvisoActualizacion />
      </SGCProvider>
    </ToastProvider>
  </React.StrictMode>,
)
