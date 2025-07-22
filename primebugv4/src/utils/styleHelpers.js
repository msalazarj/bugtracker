// src/utils/styleHelpers.js

/**
 * Devuelve clases de Tailwind para el badge de estado de un bug.
 * @param {string} estado - El estado del bug (e.g., 'Resuelto', 'Abierto').
 * @returns {string} Clases de Tailwind CSS.
 */
 export const getStatusBadgeClass = (estado) => {
  switch (estado) {
    case 'Resuelto': return 'bg-[#22C55E] text-white'; // Verde - Positivo
    case 'Abierto': return 'bg-[#3B82F6] text-white'; // Azul - Informativo
    case 'En Progreso': return 'bg-[#EAB308] text-white'; // Ámbar - En Progreso
    case 'Reabierto': return 'bg-[#DC2626] text-white'; // Rojo - Peligro/Atención
    case 'Cerrado': return 'bg-gray-500 text-white'; // Gris - Neutral
    default: return 'bg-gray-400 text-white';
  }
};

/**
 * Devuelve clases de Tailwind para el badge de prioridad de un bug.
 * @param {string} prioridad - La prioridad del bug (e.g., 'Alta', 'Normal').
 * @returns {string} Clases de Tailwind CSS.
 */
export const getPriorityBadgeClass = (prioridad) => {
  switch (prioridad) {
    case 'Crítica': return 'bg-[#DC2626] text-white'; // Rojo - Peligro
    case 'Alta': return 'bg-[#DC2626] text-white'; // Rojo - Peligro
    case 'Normal': return 'bg-gray-500 text-white'; // Gris - Neutral (asimilado a Media)
    case 'Baja': return 'bg-[#EAB308] text-white'; // Ámbar - Atención
    default: return 'bg-gray-400 text-white';
  }
};

/**
 * Devuelve clases de Tailwind para el badge de resolución de un bug.
 * @param {string} resolucion - La resolución del bug (e.g., 'Completada').
 * @returns {string} Clases de Tailwind CSS.
 */
export const getResolutionBadgeClass = (resolucion) => {
    switch (resolucion) {
      case 'Completada': return 'bg-[#22C55E] text-white'; // Verde - Positivo
      case 'No Aplica':
      case 'Duplicada':
      case 'Información Insuficiente':
      case 'No se puede reproducir': return 'bg-[#EAB308] text-white'; // Ámbar - Atención
      default: return 'bg-gray-400 text-white';
    }
};