import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../layouts/Sidebar'; 
import { doc, getDoc, collection, query, where, onSnapshot, limit, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext.jsx'; // Añadimos Auth
import { FaChevronRight, FaHome, FaBars, FaBell } from 'react-icons/fa'; // Añadimos FaBell
import NotificationsDropdown from './NotificationsDropdown.jsx'; // Asegúrate que esta ruta sea correcta

// --- COMPONENTE TOPBAR (AHORA CON NOTIFICACIONES) ---
const Topbar = ({ toggleSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Estados para Breadcrumbs
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const projectIdIndex = pathSegments.indexOf('proyectos') + 1;
    const projectId = projectIdIndex > 0 && pathSegments[projectIdIndex] ? pathSegments[projectIdIndex] : null;
    const [projectName, setProjectName] = useState('');

    // Estados para Notificaciones
    const notificationsRef = useRef(null);
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // 1. Efecto: Obtener el nombre del proyecto
    useEffect(() => {
        const fetchProjectName = async () => {
            if (projectId && projectId !== 'crear') {
                try {
                    const cachedName = sessionStorage.getItem(`pname_${projectId}`);
                    if (cachedName) {
                        setProjectName(cachedName);
                        return;
                    }
                    const docRef = doc(db, 'projects', projectId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const name = docSnap.data().nombre;
                        setProjectName(name);
                        sessionStorage.setItem(`pname_${projectId}`, name);
                    }
                } catch (e) {
                    console.error("Error fetching name", e);
                }
            } else {
                setProjectName('');
            }
        };
        fetchProjectName();
    }, [projectId]);

    // 2. Efecto: Escuchar Notificaciones
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "notifications"), where("recipient_id", "==", user.uid), limit(20));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            notifs.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.is_read).length);
        });
        return () => unsubscribe();
    }, [user]);

    // 3. Efecto: Cerrar Dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 4. Manejadores de Notificaciones
    const handleNotificationClick = async (notificationId, targetLink) => {
        if (targetLink && targetLink !== '#') navigate(targetLink);
        setNotificationsOpen(false);
        try {
            await updateDoc(doc(db, "notifications", notificationId), { is_read: true });
        } catch (error) { 
            console.error("Error al marcar como leída:", error); 
        }
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;
        try {
            const batch = writeBatch(db);
            const unreadNotifs = notifications.filter(n => !n.is_read);
            
            unreadNotifs.forEach(notif => {
                const notifRef = doc(db, "notifications", notif.id);
                batch.update(notifRef, { is_read: true });
            });

            await batch.commit();
        } catch (error) {
            console.error("Error al marcar todas como leídas:", error);
        }
    };

    // 5. Construcción de Breadcrumbs
    const getBreadcrumbs = () => {
        let crumbs = [{ label: 'Dashboard', path: '/dashboard', icon: <FaHome/> }];
        
        if (pathSegments.includes('proyectos')) {
            crumbs.push({ label: 'Proyectos', path: '/proyectos' });
            
            if (projectId && projectId !== 'crear') {
                crumbs.push({ 
                    label: projectName || 'Cargando...', 
                    path: `/proyectos/${projectId}` 
                });

                if (pathSegments.includes('bugs')) {
                    crumbs.push({ label: 'Tablero de Bugs', path: `/proyectos/${projectId}/bugs` });
                    if (pathSegments.includes('crear')) {
                         crumbs.push({ label: 'Reportar Bug', path: '#' });
                    } else {
                         const bugIndex = pathSegments.indexOf('bugs') + 1;
                         if (pathSegments[bugIndex] && pathSegments[bugIndex] !== 'crear') {
                             crumbs.push({ label: 'Detalle Bug', path: '#' });
                         }
                    }
                }
            } else if (pathSegments.includes('crear')) {
                crumbs.push({ label: 'Nuevo Proyecto', path: '#' });
            }
        } else if (pathSegments.includes('equipos')) {
            crumbs.push({ label: 'Equipos', path: '/equipos' });
        } else if (pathSegments.includes('reportes')) {
            crumbs.push({ label: 'Reportes', path: '/reportes' });
        }

        return crumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 sticky top-0 z-40 shadow-sm">
            
            {/* Lado Izquierdo: Botón Menú y Breadcrumbs */}
            <div className="flex items-center flex-1 min-w-0">
                <button 
                    onClick={toggleSidebar}
                    className="p-2 mr-4 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden transition-colors flex-shrink-0"
                >
                    <FaBars size={20} />
                </button>

                <nav className="flex items-center text-sm font-medium text-slate-500 overflow-hidden">
                    {breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;
                        return (
                            <React.Fragment key={index}>
                                {index > 0 && <FaChevronRight className="mx-2 md:mx-3 text-slate-300 text-[10px] flex-shrink-0" />}
                                
                                {isLast || crumb.path === '#' ? (
                                    <span className={`flex items-center gap-2 truncate ${isLast ? 'text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-md' : ''}`}>
                                        {crumb.icon} <span className="truncate">{crumb.label}</span>
                                    </span>
                                ) : (
                                    <Link to={crumb.path} className="hover:text-indigo-600 hover:underline flex items-center gap-2 transition-colors truncate">
                                        {crumb.icon} <span className="truncate">{crumb.label}</span>
                                    </Link>
                                )}
                            </React.Fragment>
                        );
                    })}
                </nav>
            </div>

            {/* Lado Derecho: Campanita de Notificaciones */}
            <div className="flex items-center flex-shrink-0 ml-4">
                <div className="relative" ref={notificationsRef}>
                    <button 
                        onClick={() => setNotificationsOpen(!isNotificationsOpen)} 
                        className={`p-2 relative rounded-full transition-colors ${isNotificationsOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}
                    >
                        <FaBell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                        )}
                    </button>
                    
                    {isNotificationsOpen && (
                        <NotificationsDropdown 
                            notifications={notifications}
                            onNotificationClick={handleNotificationClick}
                            onMarkAllAsRead={handleMarkAllAsRead}
                        />
                    )}
                </div>
            </div>

        </header>
    );
};

// --- COMPONENTE PRINCIPAL (LAYOUT) ---
const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
            {/* Sidebar recibe props para controlar su visibilidad */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            {/* Overlay para cerrar el sidebar al hacer click fuera en móviles */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[45] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300 min-w-0">
                {/* Se llama al Topbar integrado */}
                <Topbar toggleSidebar={() => setIsSidebarOpen(true)} />
                <main className="p-4 md:p-8 flex-1 overflow-y-auto h-[calc(100vh-64px)]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;