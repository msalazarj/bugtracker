// src/layouts/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const MainLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen bg-slate-50 font-sans">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`relative flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}>
        
        <Topbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            {/* Force re-render by adding a key that changes with the path */}
            <Outlet key={window.location.pathname} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
