// src/utils/LocationLogger.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * @file LocationLogger.jsx
 * @description Utilidad de depuración para rastrear la navegación en Project IDX.
 * Ayuda a verificar que los redireccionamientos de Firebase Auth funcionen correctamente.
 */

const LocationLogger = () => {
  const location = useLocation();

  useEffect(() => {
    // Definimos estilos para que el log destaque en la consola de IDX
    const pathStyle = 'color: #6366f1; font-weight: bold; background: #f5f3ff; padding: 2px 5px; border-radius: 4px;';
    const infoStyle = 'color: #6b7280; font-style: italic;';

    // Registramos la ruta actual y los parámetros si existen
    console.group(`📍 Navegación: ${location.pathname}`);
    console.log(`%cRUTA COMPLETA: %c${location.pathname}${location.search}${location.hash}`, infoStyle, pathStyle);
    
    if (location.search) {
      console.log('%cQUERY PARAMS:', 'color: #f59e0b; font-weight: bold;', location.search);
    }
    
    console.groupEnd();

  }, [location]);

  return null; // Componente invisible
};

export default LocationLogger;