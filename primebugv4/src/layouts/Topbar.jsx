// src/layouts/Topbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import Tippy from '@tippyjs/react';
import { NavLink } from 'react-router-dom';
// COMENTARIO: Se importan los íconos de react-icons/fa
import { FaBell, FaPlus, FaSignOutAlt } from 'react-icons/fa';

import NotificationsDropdown, { mockNotifications } from './NotificationsDropdown.jsx'; 

/**
 * @file Componente de la barra superior.
 * @module layouts/Topbar
 */

const Topbar = () => {
  const { user, profile, signOut } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const notificationsRef = useRef(null);

  useEffect(() => {
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.is_read).length);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold text-gray-700">PrimeTrack</h2>
      </div>

      <div className="flex items-center space-x-2">
        {/* COMENTARIO: Botón "Nuevo Bug" estandarizado */}
        <Tippy content="Crear nuevo Bug/Tarea">
          <NavLink to="/proyectos" className="btn-primary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap">
            <FaPlus className="mr-2" />
            <span>Nuevo Bug</span>
          </NavLink>
        </Tippy>

        {/* Sección de Notificaciones */}
        <div className="relative" ref={notificationsRef}>
          <Tippy content="Notificaciones">
            {/* COMENTARIO: Botón de notificaciones estandarizado */}
            <button 
              onClick={() => setIsNotificationsOpen(prev => !prev)}
              className="relative text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <FaBell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </Tippy>

          {isNotificationsOpen && (
            <NotificationsDropdown 
              notifications={notifications}
              onNotificationClick={() => setIsNotificationsOpen(false)}
              onMarkAllAsRead={handleMarkAllAsRead}
            />
          )}
        </div>
        
        {/* Sección de Perfil de Usuario */}
        {user && (
          <div className="flex items-center space-x-2 border-l pl-2 ml-2">
            <NavLink to="/perfil" className="flex items-center p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold mr-3 overflow-hidden shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  profile?.nombre_completo?.charAt(0).toUpperCase() || (user.email ? user.email.charAt(0).toUpperCase() : 'U')
                )}
              </div>
              <span className="hidden sm:inline font-semibold">{profile?.nombre_completo || user.email}</span>
            </NavLink>
            <Tippy content="Cerrar Sesión">
              {/* COMENTARIO: Botón de logout estandarizado */}
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors duration-200">
                <FaSignOutAlt className="h-5 w-5" />
              </button>
            </Tippy>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;