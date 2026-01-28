// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Importante: Aquí cargamos Tailwind y tus estilos Pro
import App from './App';

/**
 * Punto de entrada principal de PrimeBug.
 * En Project IDX, React 18 utiliza createRoot para habilitar el renderizado concurrente,
 * lo que mejora la respuesta de la interfaz al interactuar con Firebase.
 */

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* El componente App ya contiene el AuthProvider y el Router, 
      asegurando que toda la aplicación tenga acceso a la sesión de Firebase.
    */}
    <App />
  </React.StrictMode>
);