import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

const preLoader = document.getElementById('pre-loader')
if (preLoader) {
  preLoader.style.transition = 'opacity 0.3s ease'
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      preLoader.style.opacity = '0'
      setTimeout(() => preLoader.remove(), 320)
    })
  })
}
