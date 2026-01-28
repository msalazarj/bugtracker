// src/layouts/Topbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { collection, query, where, onSnapshot, orderBy, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import Tippy from '@tippyjs/react';
import { FaBell, FaPlus, FaSignOutAlt, FaBars } from 'react-icons/fa'; // --- REPARACIÓN: Añadido FaBars ---
import NotificationsDropdown from './NotificationsDropdown.jsx'; 

// --- REPARACIÓN: Recibe toggleSidebar como prop ---
const Topbar = ({ toggleSidebar }) => {
  const { user, profile, signOut } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("recipient_id", "==", user.uid),
      orderBy("created_at", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.is_read) {
          const ref = doc(db, "notifications", n.id);
          batch.update(ref, { is_read: true });
        }
      });
      await batch.commit();
    } catch (error) {
      console.error("Error al marcar notificaciones:", error);
    }
  };

  return (
    <header className="bg-white h-20 flex items-center justify-between px-4 sm:px-8 border-b border-slate-100 sticky top-0 z-40">
      <div className="flex items-center">
        {/* --- REPARACIÓN: Botón para mostrar/ocultar Sidebar en móviles --- */}
        <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-500 rounded-md hover:text-slate-900 hover:bg-slate-100 mr-4">
          <FaBars className="h-6 w-6" />
        </button>

        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest hidden md:block">
          Plataforma de Control
        </h2>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <Tippy content="Reportar nueva incidencia">
          <NavLink to="/proyectos" className="btn-primary flex items-center px-4 py-2 text-sm">
            <FaPlus className="mr-2" />
            <span className="hidden sm:inline">Nuevo Bug</span>
          </NavLink>
        </Tippy>

        <div className="h-6 w-px bg-slate-100 mx-2 hidden sm:block"></div>

        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`p-2.5 rounded-xl transition-all relative ${
              unreadCount > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <FaBell className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600 border-2 border-white"></span>
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <NotificationsDropdown 
              notifications={notifications}
              onNotificationClick={() => setIsNotificationsOpen(false)}
              onMarkAllAsRead={handleMarkAllAsRead}
            />
          )}
        </div>
        
        {user && (
          <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-4 border-l border-slate-100">
            <NavLink to="/perfil" className="group flex items-center">
              <div className="text-right mr-3 hidden lg:block">
                <p className="text-sm font-black text-slate-800 leading-none mb-1 group-hover:text-indigo-600 transition-colors">
                  {profile?.nombre_completo || 'Usuario'}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  Ver Perfil
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border-2 border-transparent group-hover:border-indigo-100 transition-all">
                <img 
                  src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.nombre_completo || 'U')}&background=6366f1&color=fff`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </NavLink>
            <Tippy content="Salir del sistema">
              <button onClick={() => window.confirm("¿Cerrar sesión?") && signOut()} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hidden sm:block">
                <FaSignOutAlt />
              </button>
            </Tippy>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
