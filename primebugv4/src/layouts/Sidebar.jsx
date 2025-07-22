// src/layouts/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Tippy from '@tippyjs/react';
// COMENTARIO: Se importan los componentes de íconos de react-icons/fa
import {
    FaTachometerAlt, FaShieldAlt, FaUsers, FaFolderOpen, FaInfoCircle,
    FaUserFriends, FaBug, FaSignOutAlt
} from 'react-icons/fa';

// --- Mock Data y Helpers (sin cambios) ---
const mockProjects = [
    { id: 'proyecto_mock_001', name: 'Desarrollo App PrimeTrack (Ejemplo)' },
    { id: 'proyecto_mock_002', name: 'Migración Cloud' },
    { id: 'proyecto_mock_003', name: 'Investigación IA' },
];

const getProjectById = (id) => mockProjects.find(p => p.id === id);


const Sidebar = ({ projectId }) => {  
  const { signOut, user, profile } = useAuth();
  const [currentProject, setCurrentProject] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (projectId) {
      const project = getProjectById(projectId);
      setCurrentProject(project);
    } else {
      setCurrentProject(null);
    }
  }, [projectId]);

  const handleLogout = async () => {
    await signOut();
  };
  
  const getNavLinkClasses = ({ isActive }) => {
    const baseClasses = "flex items-center px-3 py-2 text-sm rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150";
    const activeClasses = "bg-gray-700 text-white";
    return `${baseClasses} ${isActive ? activeClasses : ''}`;
  };

  const getProjectSubNavLinkClasses = ({ isActive }) => {
    const baseClasses = "flex items-center pl-3 pr-2 py-2 text-sm rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 border-l-4 border-transparent"; 
    const activeClasses = "bg-gray-700 text-white border-l-4 border-blue-400";
    return `${baseClasses} ${isActive ? activeClasses : ''}`;
  };
  
  const isProjectsSectionActive = location.pathname.startsWith('/proyectos');

  return (
    <div className="w-64 bg-gray-800 text-gray-300 flex flex-col min-h-screen">
      <div className="p-6 text-center border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white">PrimeTrack</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6">
            <h2 className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menú</h2>
            <nav className="space-y-1">
                {/* COMENTARIO: Se reemplazan los <i> por componentes de react-icons */}
                <NavLink to="/dashboard" className={getNavLinkClasses}>
                    <FaTachometerAlt className="mr-3 w-5 text-center" />
                    Dashboard
                </NavLink>
                <NavLink to="/equipos" className={getNavLinkClasses}>
                    <FaShieldAlt className="mr-3 w-5 text-center" />
                    Equipo
                </NavLink>
                <NavLink to="/miembros" className={getNavLinkClasses}>
                    <FaUsers className="mr-3 w-5 text-center" />
                    Miembros
                </NavLink>
                <NavLink to="/proyectos" className={getNavLinkClasses({ isActive: isProjectsSectionActive })}>
                    <FaFolderOpen className="mr-3 w-5 text-center" />
                    Proyectos
                </NavLink>
            </nav>
        </div>

        {currentProject && (
          <div className="px-4 pb-6 mt-4 pt-4 border-t border-gray-700">
            <h2 className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider truncate" title={currentProject.name}>
              {currentProject.name}
            </h2>
            <nav className="space-y-1">
              <NavLink to={`/proyectos/${projectId}`} end className={getProjectSubNavLinkClasses}>
                <FaInfoCircle className="mr-3 w-5 text-center" />
                Detalle del Proyecto
              </NavLink>
              <NavLink to={`/proyectos/${projectId}/miembros`} className={getProjectSubNavLinkClasses}>
                <FaUserFriends className="mr-3 w-5 text-center" />
                Miembros
              </NavLink>
              <NavLink to={`/proyectos/${projectId}/issues`} className={getProjectSubNavLinkClasses}>
                <FaBug className="mr-3 w-5 text-center" />
                Issues
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-700">
        {user && (
          <NavLink to="/perfil" className="flex items-center text-sm font-semibold text-gray-200 mb-4 hover:bg-gray-700 p-2 rounded-md">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-lg font-bold mr-3 shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                profile?.nombre_completo?.charAt(0).toUpperCase() || (user.email ? user.email.charAt(0).toUpperCase() : 'U')
              )}
            </div>
            <span className="truncate">{profile?.nombre_completo || user.email}</span>
          </NavLink>
        )}
        <Tippy content="Cerrar sesión">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-2 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold transition duration-200 ease-in-out"
          >
            <FaSignOutAlt className="mr-2" /> Cerrar Sesión
          </button>
        </Tippy>
      </div>
    </div>
  );
};

export default Sidebar;