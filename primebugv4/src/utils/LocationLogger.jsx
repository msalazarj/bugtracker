// src/utils/LocationLogger.jsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const LocationLogger = () => {
  const location = useLocation();

  useEffect(() => {
    // Este efecto se ejecutará cada vez que la ubicación cambie
    console.log(`%cROUTER DEBUG: Nueva ubicación detectada -> ${location.pathname}`, 'color: blue; font-weight: bold;');
  }, [location]);

  return null; // Este componente no renderiza nada en la pantalla
};

export default LocationLogger;