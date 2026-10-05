import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { SGCProvider } from './SGCContext.jsx'
import { ToastProvider } from './components/common/Toast.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <SGCProvider>
        <App />
      </SGCProvider>
    </ToastProvider>
  </React.StrictMode>,
)
