// src/layouts/MainLayout.jsx

import React from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const MainLayout = () => {
  // Usamos useMatch para ver si la ruta actual coincide con el patrón de un proyecto.
  // Esto nos permite obtener el ID del proyecto de forma robusta.
  const projectMatch = useMatch('/proyectos/:projectId/*'); // Se usa :projectId para consistencia
  const projectId = projectMatch?.params.projectId; // Se extrae el 'projectId' si hay coincidencia

  // COMENTARIO: El código de depuración ha sido eliminado para la versión final.

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Pasamos el projectId detectado como prop al Sidebar */}
      <Sidebar projectId={projectId} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50"> {/* Un fondo ligeramente diferente para el área de contenido */}
          {/* Este Outlet es crucial. Aquí se renderizará TeamList, ProjectDetail, etc. */}
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default MainLayout;