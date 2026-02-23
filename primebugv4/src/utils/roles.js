// src/utils/roles.js

// Roles para Equipos
export const TEAM_ROLES = {
    OWNER: 'Propietario',
    MEMBER: 'Miembro'
};

// Roles para Proyectos
export const PROJECT_ROLES = {
    CREATOR: 'Creador',
    DEVELOPER: 'Desarrollador',
    QA_CLIENT: 'QA Cliente',
    QA_IT: 'QA TI'
};

// Estilos visuales (Badges) para la UI
export const ROLE_STYLES = {
    // Equipos
    [TEAM_ROLES.OWNER]: 'bg-amber-100 text-amber-700 border-amber-200',
    [TEAM_ROLES.MEMBER]: 'bg-slate-100 text-slate-600 border-slate-200',
    
    // Proyectos
    [PROJECT_ROLES.CREATOR]: 'bg-purple-100 text-purple-700 border-purple-200',
    [PROJECT_ROLES.DEVELOPER]: 'bg-blue-100 text-blue-700 border-blue-200',
    [PROJECT_ROLES.QA_CLIENT]: 'bg-rose-100 text-rose-700 border-rose-200',
    [PROJECT_ROLES.QA_IT]: 'bg-teal-100 text-teal-700 border-teal-200',
};