// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './assets/styles/global.css'; // Importa tus estilos globales (ej. Tailwind CSS)

/**
 * @file Punto de entrada principal de la aplicación React.
 * @module main
 */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);