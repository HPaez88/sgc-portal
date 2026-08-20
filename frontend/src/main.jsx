import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { SGCProvider } from './SGCContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SGCProvider>
      <App />
    </SGCProvider>
  </React.StrictMode>,
)
