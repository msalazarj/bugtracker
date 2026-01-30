// src/layouts/Topbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { FaBell, FaPlus, FaBars, FaChevronRight } from 'react-icons/fa';
import NotificationsDropdown from './NotificationsDropdown.jsx';

const friendlyNames = {
    'equipos': 'Equipos',
    'miembros': 'Miembros',
    'proyectos': 'Proyectos',
    'archivos': 'Archivos',
    'incidencias': 'Incidencias',
    'crear': 'Crear',
};

const useDocumentName = (collectionName, docId, user) => {
    const [name, setName] = useState(docId);

    useEffect(() => {
        if (!docId || !collectionName || !user || docId.length !== 20) {
            setName(friendlyNames[docId] || docId);
            return;
        }

        const fetchName = async () => {
            try {
                const docRef = doc(db, collectionName, docId);
                const docSnap = await getDoc(docRef);
                setName(docSnap.exists() ? (docSnap.data().nombre || docSnap.data().name || docId) : docId);
            } catch (e) {
                console.error(`Error fetching document name:`, e);
                setName(docId);
            }
        };

        fetchName();
    }, [docId, collectionName, user]);

    return name;
};

const BreadcrumbItem = ({ segment, collectionName, isLast, user }) => {
    const name = useDocumentName(collectionName, segment, user);
    const classes = isLast
        ? 'text-indigo-600 font-bold pointer-events-none' 
        : 'text-slate-500 hover:text-indigo-600';

    return <span className={`transition-colors truncate ${classes}`}>{name}</span>;
};

const Topbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();
  const notificationsRef = useRef(null);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pathSegments = location.pathname.split('/').filter(segment => segment && segment.toLowerCase() !== 'dashboard');

  return (
    <header className="sticky top-0 z-30 bg-slate-100/80 backdrop-blur-sm">
       <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-slate-200">
            <div className="flex items-center gap-x-3 overflow-hidden">
                <button onClick={toggleSidebar} className="p-2 text-slate-500 rounded-full md:hidden">
                    <FaBars className="h-6 w-6" />
                </button>
                
                <nav className="flex items-center text-sm font-semibold whitespace-nowrap">
                    <Link to="/dashboard" className="text-slate-500 hover:text-indigo-600 flex-shrink-0">
                        Dashboard
                    </Link>
                    {pathSegments.map((segment, index) => {
                        const builtPath = `/dashboard/${pathSegments.slice(0, index + 1).join('/')}`;
                        const lastSegment = pathSegments[index - 1];
                        
                        let collectionName = null;
                        if (lastSegment === 'proyectos') collectionName = 'projects';
                        if (lastSegment === 'equipos') collectionName = 'teams';

                        return (
                            <React.Fragment key={index}>
                                <FaChevronRight className="h-3 w-3 text-slate-400 mx-2 flex-shrink-0" />
                                <Link to={builtPath} className="truncate">
                                    <BreadcrumbItem 
                                        segment={segment} 
                                        collectionName={collectionName}
                                        isLast={index === pathSegments.length - 1}
                                        user={user}
                                    />
                                </Link>
                            </React.Fragment>
                        );
                    })}
                </nav>
            </div>

            {user && <div className="flex items-center gap-x-2">
                 <Tippy content="Reportar Bug" placement="bottom">
                    <NavLink to="/proyectos" className="btn-primary flex items-center gap-x-2 px-3 py-2 text-sm">
                        <FaPlus />
                        <span className="hidden sm:inline">Nuevo Bug</span>
                    </NavLink>
                </Tippy>
                
                 <div className="relative" ref={notificationsRef}>
                    <Tippy content="Notificaciones" placement="bottom">
                      <button
                        onClick={() => setNotificationsOpen(prev => !prev)}
                        className="p-2 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
                      >
                        <FaBell className="h-5 w-5" />
                      </button>
                    </Tippy>
                    {isNotificationsOpen && (
                      <NotificationsDropdown 
                        isOpen={isNotificationsOpen} 
                        onClose={() => setNotificationsOpen(false)}
                      />
                    )}
                 </div>
            </div>}
        </div>
    </header>
  );
};

export default Topbar;
