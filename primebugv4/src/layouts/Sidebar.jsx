// src/layouts/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useMatch } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext.jsx';
import { 
    FaTachometerAlt, FaUsers, FaProjectDiagram, FaBug, 
    FaSignOutAlt, FaFolder, FaUserFriends, FaFileAlt
} from 'react-icons/fa';

// Componente de Navegación reutilizable
const NavItem = ({ to, icon, children, isSidebarOpen, end = true }) => {
    const baseClasses = "flex items-center gap-x-4 px-6 py-3 text-base font-medium text-slate-300 rounded-lg hover:bg-slate-800 transition-colors";
    const activeClasses = "bg-indigo-600 text-white";
    const collapsedIconOnly = "w-full justify-center";

    return (
        <NavLink to={to} end={end} className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : ''} ${!isSidebarOpen ? collapsedIconOnly : ''}`}>
            {icon}
            {isSidebarOpen && <span className="truncate">{children}</span>}
        </NavLink>
    );
};

// Divisor visual para separar secciones del menú
const SidebarSeparator = ({ isSidebarOpen }) => (
    isSidebarOpen ? <hr className="border-t border-slate-700 mx-6 my-4" /> : null
);

const Sidebar = ({ isSidebarOpen }) => {
    const { user, profile, signOut } = useAuth(); // `signOut` puede no estar en el contexto base
    const navigate = useNavigate();
    
    const projectMatch = useMatch('/proyectos/:projectId/*');
    const projectId = projectMatch?.params.projectId;

    const [projectName, setProjectName] = useState('');

    useEffect(() => {
        if (!projectId) {
            setProjectName('');
            return;
        }
        const fetchProjectName = async () => {
            const projectRef = doc(db, 'projects', projectId);
            const docSnap = await getDoc(projectRef);
            if (docSnap.exists()) {
                setProjectName(docSnap.data().nombre);
            }
        };
        fetchProjectName();
    }, [projectId]);

    const handleSignOut = async () => {
        // Esta función puede fallar si `signOut` no está definido en el contexto
        if (typeof signOut === 'function') {
            await signOut();
        }
        navigate('/login');
    }

    return (
        <aside className={`fixed top-0 left-0 h-full bg-slate-900 text-white transition-all duration-300 z-30 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className="flex flex-col h-full">
                <div className={`flex items-center h-20 border-b border-slate-700 ${isSidebarOpen ? 'px-6' : 'px-4 justify-center'}`}>
                    <Link to="/" className="flex items-center gap-3">
                        <FaBug className="text-indigo-400 text-3xl flex-shrink-0" />
                        {isSidebarOpen && <span className="text-xl font-bold tracking-wider whitespace-nowrap">PrimeBug</span>}
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <NavItem to="/" icon={<FaTachometerAlt className="text-lg" />} isSidebarOpen={isSidebarOpen}>Dashboard</NavItem>
                    <SidebarSeparator isSidebarOpen={isSidebarOpen} />
                    <NavItem to="/equipos" icon={<FaUsers className="text-lg" />} isSidebarOpen={isSidebarOpen}>Equipos</NavItem>
                    <NavItem to="/miembros" icon={<FaUserFriends className="text-lg" />} isSidebarOpen={isSidebarOpen}>Miembros</NavItem>
                    <NavItem to="/proyectos" icon={<FaProjectDiagram className="text-lg" />} isSidebarOpen={isSidebarOpen} end={false}>Proyectos</NavItem>

                    {projectId && (
                        <>
                            <SidebarSeparator isSidebarOpen={isSidebarOpen} />
                            {isSidebarOpen && <span className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Proyecto</span>}
                            {isSidebarOpen && <p className="px-6 pt-2 pb-1 text-base font-semibold text-white truncate">{projectName || 'Cargando...'}</p>}
                            <NavItem to={`/proyectos/${projectId}`} icon={<FaFolder className="text-lg" />} isSidebarOpen={isSidebarOpen}>Detalles</NavItem>
                            <NavItem to={`/proyectos/${projectId}/miembros`} icon={<FaUsers className="text-lg" />} isSidebarOpen={isSidebarOpen}>Miembros</NavItem>
                            <NavItem to={`/proyectos/${projectId}/archivos`} icon={<FaFileAlt className="text-lg" />} isSidebarOpen={isSidebarOpen}>Archivos</NavItem>
                            <NavItem to={`/proyectos/${projectId}/issues`} icon={<FaBug className="text-lg" />} isSidebarOpen={isSidebarOpen} end={false}>Bugs</NavItem>
                        </>
                    )}
                </nav>

                <div className="px-4 py-4 border-t border-slate-700">
                     <div className={`flex items-center ${isSidebarOpen ? 'gap-x-4' : 'justify-center'}`}>
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
                            {/* Este acceso puede causar error si `profile` es null */}
                            {profile?.nombre_completo ? profile.nombre_completo.charAt(0) : (user ? user.email.charAt(0).toUpperCase() : 'U')}
                        </div>
                        {isSidebarOpen && (
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-semibold text-white truncate">{profile?.nombre_completo || 'Usuario'}</p>
                                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            </div>
                        )}
                         <button onClick={handleSignOut} title="Cerrar sesión" className={`p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ${!isSidebarOpen ? 'ml-auto' : ''}`}>
                            <FaSignOutAlt className="text-lg" />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;