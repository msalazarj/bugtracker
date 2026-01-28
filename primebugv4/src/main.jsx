// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Importamos index.css donde profesionalizamos los estilos de Tailwind
import './index.css'; 

/**
 * @file main.jsx
 * @description Punto de entrada para el motor de renderizado de Vite.
 * Monta la aplicación en el nodo 'root' del index.html.
 */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* App actúa como el orquestador principal, envolviendo 
      la lógica en el AuthProvider y el Router.
    */}
    <App />
  </React.StrictMode>,
);