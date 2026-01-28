// src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * @file MainLayout.jsx
 * @description Orquestador visual de la aplicación protegida.
 * Maneja la persistencia de la barra lateral y superior.
 */
const MainLayout = () => {
  // Detectamos si estamos dentro de un proyecto para habilitar menús contextuales en el Sidebar
  const projectMatch = useMatch('/proyectos/:projectId/*');
  const projectId = projectMatch?.params.projectId;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar: Se mantiene fijo a la izquierda. 
          Recibe el projectId para resaltar el proyecto activo o mostrar links de issues.
      */}
      <Sidebar projectId={projectId} />

      {/* Contenedor Principal: Topbar + Contenido Dinámico */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <Topbar />

        <main className="flex-1 overflow-y-auto relative custom-scrollbar">
          {/* Contenedor de contenido con padding responsivo y 
              animación de entrada para que las páginas no aparezcan de golpe.
          */}
          <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            {/* Aquí es donde React Router inyecta las páginas (Dashboard, BugList, etc.) */}
            <Outlet context={{ projectId }} /> 
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;