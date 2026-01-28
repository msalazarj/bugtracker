/**
 * @file styleHelpers.js
 * @description Centraliza la lógica de estilos para badges y estados del sistema.
 */

/**
 * Clases de Tailwind para el estado de un bug.
 * Se utilizan tonos suaves para el fondo y fuertes para el texto (Mejor accesibilidad).
 */
export const getStatusBadgeClass = (estado) => {
  switch (estado) {
    case 'Resuelto': 
      return 'bg-green-100 text-green-700 border border-green-200';
    case 'Abierto': 
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'En Progreso': 
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'Reabierto': 
      return 'bg-red-100 text-red-700 border border-red-200';
    case 'Cerrado': 
      return 'bg-gray-100 text-gray-600 border border-gray-200';
    default: 
      return 'bg-gray-50 text-gray-500 border border-gray-200';
  }
};

/**
 * Clases de Tailwind para la prioridad de un bug.
 */
export const getPriorityBadgeClass = (prioridad) => {
  switch (prioridad) {
    case 'Crítica': 
      return 'bg-red-600 text-white shadow-sm'; // Color sólido para máxima urgencia
    case 'Alta': 
      return 'bg-red-100 text-red-700 border border-red-200';
    case 'Media':
    case 'Normal': 
      return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
    case 'Baja': 
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    default: 
      return 'bg-gray-100 text-gray-600';
  }
};

/**
 * Clases de Tailwind para la resolución final.
 */
export const getResolutionBadgeClass = (resolucion) => {
  switch (resolucion) {
    case 'Completada': 
      return 'bg-green-600 text-white';
    case 'Duplicada':
    case 'Información Insuficiente':
    case 'No se puede reproducir': 
      return 'bg-orange-100 text-orange-700 border border-orange-200';
    case 'No Aplica': 
      return 'bg-gray-200 text-gray-700';
    default: 
      return 'bg-gray-100 text-gray-500';
  }
};