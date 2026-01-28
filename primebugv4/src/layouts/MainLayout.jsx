// src/layouts/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const MainLayout = () => {
  const projectMatch = useMatch('/proyectos/:projectId/*');
  const projectId = projectMatch?.params.projectId;

  // --- REPARACIÓN: Estado centralizado para el Sidebar ---
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // --- REPARACIÓN: Controlar el estado en pantallas pequeñas ---
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // Tailwind 'lg' breakpoint
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Llamada inicial
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* --- REPARACIÓN: Pasar el estado al Sidebar --- */}
      <Sidebar projectId={projectId} isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* --- REPARACIÓN: Contenedor principal con margen dinámico --- */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        
        {/* --- REPARACIÓN: Pasar la función de toggle al Topbar --- */}
        <Topbar toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <Outlet context={{ projectId }} /> 
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
