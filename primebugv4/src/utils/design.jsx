import React from 'react';

import {

    FaBug, FaLightbulb, FaTasks, FaLayerGroup, FaEye

} from 'react-icons/fa';



/**

 * SISTEMA DE DISEÑO - PRIMEBUG

 * Centraliza colores, iconos y estilos comunes para toda la aplicación.

 */



// --- 1. ESTADOS (Lifecycle) ---

export const getStatusStyles = (status) => {

    // Geometría unificada: Mismo ancho (w-24) y texto centrado para todas las tablas.

    const baseShape = 'w-24 text-center inline-block transition-colors ';

   

    const styles = {

        'Abierto':     baseShape + 'bg-blue-600 text-white shadow-sm border-transparent hover:bg-blue-700',

        'En Progreso': baseShape + 'bg-amber-500 text-amber-950 shadow-sm border-transparent hover:bg-amber-600',

        'Resuelto':    baseShape + 'bg-emerald-600 text-white shadow-sm border-transparent hover:bg-emerald-700',

        'Re Abierta':  baseShape + 'bg-red-600 text-white shadow-sm border-transparent hover:bg-red-700',

        'Cerrado':     baseShape + 'bg-slate-700 text-white shadow-sm border-transparent hover:bg-slate-800'

    };

    return styles[status] || baseShape + 'bg-slate-100 text-slate-800 border-slate-300';

};



// Helper para contextos más pequeños o fondos (como los dots en historiales o sidebars).

export const getStatusColorClass = (status) => {

    const styles = {

        'Abierto':     'text-blue-600 border-blue-200 bg-blue-50/50',

        'En Progreso': 'text-amber-600 border-amber-200 bg-amber-50/50',

        'Resuelto':    'text-emerald-600 border-emerald-200 bg-emerald-50/50',

        'Re Abierta':  'text-red-600 border-red-200 bg-red-50/50',

        'Cerrado':     'text-slate-600 border-slate-200 bg-slate-50/50'

    };

    return styles[status] || 'text-slate-600 border-slate-200 bg-slate-50';

};



// --- 2. PRIORIDADES ---

export const getPriorityStyles = (priority) => {

    // Geometría unificada: Mismo ancho (w-20) y texto centrado para uniformidad.

    const baseShape = 'w-20 text-center inline-block ';

   

    const styles = {

        'Baja':    baseShape + 'text-emerald-700 border-emerald-500 bg-emerald-50/30',

        'Media':   baseShape + 'text-blue-700 border-blue-500 bg-blue-50/30',

        'Alta':    baseShape + 'text-orange-700 border-orange-500 bg-orange-50/30',

        'Crítica': baseShape + 'text-red-700 border-red-600 bg-red-50/30 font-black ring-1 ring-red-600 ring-offset-1'

    };

    return styles[priority] || baseShape + 'text-slate-700 border-slate-300 bg-transparent';

};



// --- 3. CATEGORÍAS (Icono + Color) ---

export const getCategoryConfig = (category) => {

    switch(category) {

        case 'Mejora':

            return { icon: <FaLightbulb/>, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Mejora' };

        case 'Tarea':

            return { icon: <FaTasks/>, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Tarea' };

        case 'Transversal':

            return { icon: <FaLayerGroup/>, color: 'text-purple-600 bg-purple-50 border-purple-200', label: 'Transversal' };

        case 'Forma':

            return { icon: <FaEye/>, color: 'text-pink-600 bg-pink-50 border-pink-200', label: 'Forma / UI' };

        case 'Bug':

        default:

            return { icon: <FaBug/>, color: 'text-red-600 bg-red-50 border-red-200', label: 'Bug / Error' };

    }

};



// --- 4. TOKENS DE UI COMUNES (Clases Tailwind) ---

export const UI = {

    // Contenedores Principales

    PAGE_CONTAINER: "max-w-7xl mx-auto px-4 py-8 space-y-6",

    CARD_BASE: "bg-white rounded-2xl border border-slate-200 shadow-sm",

   

    // Tipografía de Encabezados

    HEADER_TITLE: "text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight",

    HEADER_SUBTITLE: "text-slate-500 text-lg",

   

    // Inputs: Diseño Robusto (Alto, Sombra, Focus Ring suave)

    INPUT_TEXT: "w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white shadow-sm placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium",

   

    // Botones

    BTN_PRIMARY: "bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg font-bold flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",

    BTN_SECONDARY: "bg-white text-slate-700 border border-slate-200 px-6 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors font-bold flex items-center justify-center gap-2 shadow-sm",

    BTN_PRIMARY_XS: "bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all shadow-md font-bold flex items-center justify-center gap-2 text-xs",

    BTN_SECONDARY_XS: "bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-bold flex items-center justify-center gap-2 shadow-sm text-xs",

    BTN_GHOST: "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors font-medium",

   

    // Badges Genéricos

    BADGE_BASE: "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium border",

};



// --- 5. UTILIDADES DE FORMATO ---



// Fecha corta (dd/mm/yy hh:mm)

export const formatDate = (timestamp) => {

    if (!timestamp) return '-';

    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);

    return date.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

};



// Tiempo relativo (Hace 5 min, Ahora, 20 oct)

export const formatTimeAgo = (timestamp) => {

    if (!timestamp) return '';

    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);

    const now = new Date();

    const diffInSeconds = Math.floor((now - date) / 1000);



    if (diffInSeconds < 60) return 'Ahora';

    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min`;

    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h`;

    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

};