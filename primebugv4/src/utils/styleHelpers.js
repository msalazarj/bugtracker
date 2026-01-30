
// src/utils/styleHelpers.js
import { FaFlag } from 'react-icons/fa';

/**
 * Devuelve la clase de Tailwind CSS para una "píldora" de estado de bug.
 * @param {string} status - El estado del bug (ej. "Abierto", "En Progreso").
 * @returns {string} La clase de Tailwind CSS correspondiente.
 */
export const getStatusPillClass = (status) => {
    switch (status) {
        case 'Abierto':
            return 'bg-blue-100 text-blue-700';
        case 'En Progreso':
            return 'bg-amber-100 text-amber-700';
        case 'Resuelto':
            return 'bg-green-100 text-green-700';
        case 'Cerrado':
            return 'bg-slate-200 text-slate-600';
        case 'Reabierto':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-slate-100 text-slate-600';
    }
};

/**
 * Devuelve información visual para una prioridad de bug.
 * @param {string} priority - La prioridad del bug (ej. "Crítica", "Alta").
 * @returns {{icon: Component, color: string, name: string}} Un objeto con el icono, color y nombre.
 */
export const getPriorityInfo = (priority) => {
    switch (priority) {
        case 'Crítica':
            return { icon: FaFlag, color: 'red-500', name: 'Crítica' };
        case 'Alta':
            return { icon: FaFlag, color: 'orange-500', name: 'Alta' };
        case 'Media':
            return { icon: FaFlag, color: 'yellow-500', name: 'Media' };
        case 'Baja':
            return { icon: FaFlag, color: 'slate-400', name: 'Baja' };
        default:
            return { icon: FaFlag, color: 'slate-400', name: priority || 'Sin prioridad' };
    }
};
