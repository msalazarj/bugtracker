// src/layouts/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Tippy from '@tippyjs/react';
import {
    FaTachometerAlt, FaShieldAlt, FaUsers, FaFolderOpen, FaInfoCircle,
    FaUserFriends, FaBug, FaSignOutAlt
} from 'react-icons/fa';

const Sidebar = ({ projectId }) => {  
  const { signOut, user, profile } = useAuth();
  const [currentProject, setCurrentProject] = useState(null);
  const location = useLocation();

  // 1. Obtener datos del proyecto activo desde Firestore (CORREGIDO)
  useEffect(() => {
    const fetchProjectName = async () => {
      // Solo ejecutar si tenemos projectId Y el usuario está cargado.
      if (projectId && user) {
        try {
          const docRef = doc(db, "projects", projectId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCurrentProject({ id: docSnap.id, ...docSnap.data() });
          }
        } catch (error) {
          console.error("Error al cargar nombre del proyecto (Sidebar):", error.message);
        }
      } else {
        setCurrentProject(null);
      }
    };

    fetchProjectName();
  }, [projectId, user]); // <-- Dependencia de 'user' añadida para evitar race conditions

  const handleLogout = async () => {
    if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      await signOut();
    }
  };
  
  const getNavLinkClasses = ({ isActive }) => {
    const baseClasses = "flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group";
    const activeClasses = "bg-indigo-600 text-white shadow-lg shadow-indigo-100";
    const inactiveClasses = "text-slate-400 hover:bg-slate-50 hover:text-indigo-600";
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  const getSubLinkClasses = ({ isActive }) => {
    const baseClasses = "flex items-center pl-11 pr-4 py-2 text-xs font-bold rounded-lg transition-all";
    const activeClasses = "text-indigo-600 bg-indigo-50";
    const inactiveClasses = "text-slate-400 hover:text-slate-600 hover:bg-slate-50";
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  return (
    <div className="w-72 bg-white border-r border-slate-100 flex flex-col h-screen shrink-0">
      <div className="p-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <FaBug className="text-white text-xl" />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tighter">PrimeTrack</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        <div className="mb-8">
            <h2 className="px-4 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Menú Principal</h2>
            <nav className="space-y-2">
                <NavLink to="/dashboard" className={getNavLinkClasses}>
                    <FaTachometerAlt className="mr-3 text-lg" />
                    Dashboard
                </NavLink>
                <NavLink to="/equipos" className={getNavLinkClasses}>
                    <FaShieldAlt className="mr-3 text-lg" />
                    Equipos
                </NavLink>
                <NavLink to="/miembros" className={getNavLinkClasses}>
                    <FaUsers className="mr-3 text-lg" />
                    Directorio
                </NavLink>
                <NavLink to="/proyectos" className={getNavLinkClasses}>
                    <FaFolderOpen className="mr-3 text-lg" />
                    Proyectos
                </NavLink>
            </nav>
        </div>

        {currentProject && (
          <div className="mb-8 animate-fade-in">
            <h2 className="px-4 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
              Proyecto: {currentProject.nombre}
            </h2>
            <nav className="space-y-1">
              <NavLink to={`/proyectos/${projectId}`} end className={getSubLinkClasses}>
                <FaInfoCircle className="mr-2" /> Visión General
              </NavLink>
              <NavLink to={`/proyectos/${projectId}/miembros`} className={getSubLinkClasses}>
                <FaUserFriends className="mr-2" /> Equipo Asignado
              </NavLink>
              <NavLink to={`/proyectos/${projectId}/issues`} className={getSubLinkClasses}>
                <FaBug className="mr-2" /> Issues / Bugs
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
        {user && (
          <div className="flex items-center p-3 mb-4 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-inner shrink-0">
              {profile?.nombre_completo?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{profile?.nombre_completo || 'Usuario'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-200"
        >
          <FaSignOutAlt className="mr-2" /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
