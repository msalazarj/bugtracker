// src/layouts/Topbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { doc, getDoc, collection, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import Tippy from '@tippyjs/react';
import { FaBell, FaPlus, FaBars, FaChevronRight } from 'react-icons/fa';
import NotificationsDropdown from './NotificationsDropdown.jsx';

// Hook para generar Breadcrumbs (migas de pan)
const useBreadcrumbs = () => {
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const location = useLocation();

    // Nombres amigables para segmentos de la URL
    const friendlyNames = {
        'equipos': 'Equipos',
        'miembros': 'Miembros',
        'proyectos': 'Proyectos',
        'archivos': 'Archivos',
        'issues': 'Incidencias',
        'crear': 'Crear',
    };

    useEffect(() => {
        const generateBreadcrumbs = async () => {
            const pathSegments = location.pathname.split('/').filter(Boolean);
            const crumbs = [];
            let builtPath = '';

            for (let i = 0; i < pathSegments.length; i++) {
                const segment = pathSegments[i];
                const lastSegment = pathSegments[i - 1];
                builtPath += `/${segment}`;
                let name = friendlyNames[segment] || segment;

                // Si el segmento es un ID de proyecto, buscar su nombre
                if (lastSegment === 'proyectos' && segment.length === 20) { // Asume ID de 20 caracteres
                    try {
                        const docRef = doc(db, 'projects', segment);
                        const docSnap = await getDoc(docRef);
                        if (docSnap.exists()) name = docSnap.data().nombre;
                    } catch (e) { console.error("Error fetching project name for breadcrumb:", e); }
                }
                crumbs.push({ name, path: builtPath });
            }
            setBreadcrumbs(crumbs);
        };
        generateBreadcrumbs();
    }, [location.pathname]);

    return breadcrumbs;
};

const Topbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const breadcrumbs = useBreadcrumbs();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Cargar notificaciones en tiempo real
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), where("user_id", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(notifs);
    });
    return () => unsubscribe();
  }, [user]);

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    const batch = writeBatch(db);
    notifications.forEach(notif => {
        if (!notif.is_read) {
            const notifRef = doc(db, 'notifications', notif.id);
            batch.update(notifRef, { is_read: true });
        }
    });
    await batch.commit();
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={`sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm`}>
       <div className="flex items-center justify-between h-20 px-4 sm:px-8 border-b border-slate-200">
            <div className="flex items-center gap-x-4 overflow-hidden">
                <button onClick={toggleSidebar} className="p-2 text-slate-500 rounded-full hover:text-slate-800 hover:bg-slate-200">
                    <FaBars className="h-6 w-6" />
                </button>
                <nav className="flex items-center text-sm font-semibold text-slate-700 whitespace-nowrap">
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && <FaChevronRight className="h-3 w-3 text-slate-400 mx-2" />}
                            <Link to={crumb.path} className={`hover:text-indigo-600 transition-colors ${index === breadcrumbs.length - 1 ? 'text-indigo-600 font-bold pointer-events-none' : 'text-slate-500'}`}>
                                {crumb.name}
                            </Link>
                        </React.Fragment>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-x-2 sm:gap-x-4 flex-shrink-0">
                 <Tippy content="Reportar nueva incidencia" placement="bottom">
                    <NavLink to="/proyectos" className="btn-primary flex items-center justify-center gap-x-2 px-4 py-2 text-sm font-medium">
                        <FaPlus />
                        <span className="hidden sm:inline">Nuevo Bug</span>
                    </NavLink>
                </Tippy>
                
                <div className="relative" ref={notificationsRef}>
                     <Tippy content="Notificaciones" placement="bottom">
                        <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-3 text-slate-500 rounded-full hover:text-slate-800 hover:bg-slate-200 relative">
                            <FaBell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-indigo-500 border-2 border-slate-50"></span>
                            )}
                        </button>
                     </Tippy>
                    {isNotificationsOpen && 
                        <NotificationsDropdown 
                            notifications={notifications} 
                            onMarkAllAsRead={handleMarkAllAsRead} 
                            onNotificationClick={() => setIsNotificationsOpen(false)} 
                        />
                    }
                </div>
            </div>
        </div>
    </header>
  );
};

export default Topbar;
