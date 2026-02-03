import React from 'react';
import { NavLink, Link, useNavigate, useMatch } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { 
    FaTachometerAlt, FaUsers, FaProjectDiagram, FaBug, 
    FaSignOutAlt, FaFolder, FaUserFriends, FaFileAlt,
    FaPlusCircle // Icono para la acción de crear
} from 'react-icons/fa';

const NavItem = ({ to, icon, children, isSidebarOpen, end = true }) => {
    const baseClasses = "flex items-center gap-x-4 px-6 py-3 text-base font-medium text-slate-300 rounded-lg hover:bg-slate-800 transition-colors";
    const activeClasses = "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20";
    const collapsedIconOnly = "w-full justify-center px-0";

    return (
        <NavLink 
            to={to} 
            end={end} 
            className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : ''} ${!isSidebarOpen ? collapsedIconOnly : ''}`}
        >
            <span className="text-lg flex-shrink-0">{icon}</span>
            {isSidebarOpen && <span className="truncate">{children}</span>}
        </NavLink>
    );
};

const SidebarSeparator = ({ isSidebarOpen }) => (
    isSidebarOpen ? <hr className="border-t border-slate-700 mx-6 my-4" /> : <div className="my-4" />
);

const Sidebar = ({ isSidebarOpen }) => {
    const { user, profile, signOut, hasTeam } = useAuth();
    const navigate = useNavigate();
    
    const projectMatch = useMatch('/proyectos/:projectId/*');
    const projectId = projectMatch?.params.projectId;

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    return (
        <aside className={`fixed top-0 left-0 h-full bg-slate-900 text-white transition-all duration-300 z-30 shadow-2xl ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className="flex flex-col h-full">
                {/* LOGO */}
                <div className={`flex items-center h-20 border-b border-slate-700/50 ${isSidebarOpen ? 'px-6' : 'px-0 justify-center'}`}>
                    <Link to="/dashboard" className="flex items-center gap-3 group">
                        <div className="bg-indigo-600 p-2 rounded-lg group-hover:bg-indigo-500 transition-colors">
                            <FaBug className="text-white text-xl flex-shrink-0" />
                        </div>
                        {isSidebarOpen && <span className="text-xl font-black tracking-tight text-white uppercase">PrimeBug</span>}
                    </Link>
                </div>

                {/* NAVEGACIÓN PRINCIPAL */}
                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    <NavItem to="/dashboard" icon={<FaTachometerAlt />} isSidebarOpen={isSidebarOpen}>Dashboard</NavItem>
                    
                    <SidebarSeparator isSidebarOpen={isSidebarOpen} />
                    
                    {hasTeam ? (
                        <>
                            <NavItem to="/equipos" icon={<FaUsers />} isSidebarOpen={isSidebarOpen}>Mi Equipo</NavItem>
                            <NavItem to="/miembros" icon={<FaUserFriends />} isSidebarOpen={isSidebarOpen}>Miembros</NavItem>
                            <NavItem to="/proyectos" icon={<FaProjectDiagram />} isSidebarOpen={isSidebarOpen} end={false}>Proyectos</NavItem>
                        </>
                    ) : (
                        <NavItem to="/equipos/crear" icon={<FaPlusCircle />} isSidebarOpen={isSidebarOpen}>Crear Equipo</NavItem>
                    )}

                    {/* MENÚ CONTEXTUAL DE PROYECTO (si aplica) */}
                    {projectId && hasTeam && (
                        <div className="animate-fade-in">
                            <SidebarSeparator isSidebarOpen={isSidebarOpen} />
                            {isSidebarOpen && (
                                <div className="px-6 mb-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Proyecto Activo</span>
                                </div>
                            )}
                            <NavItem to={`/proyectos/${projectId}/detalles`} icon={<FaFolder />} isSidebarOpen={isSidebarOpen}>Detalles</NavItem>
                            {/* --- LÍNEA CORREGIDA --- */}
                            <NavItem to={`/proyectos/${projectId}/miembros`} icon={<FaUsers />} isSidebarOpen={isSidebarOpen}>Miembros</NavItem>
                            <NavItem to={`/proyectos/${projectId}/bugs`} icon={<FaBug />} isSidebarOpen={isSidebarOpen} end={false}>Bugs</NavItem>
                            <NavItem to={`/proyectos/${projectId}/documentacion`} icon={<FaFileAlt />} isSidebarOpen={isSidebarOpen}>Documentación</NavItem>
                        </div>
                    )}
                </nav>

                {/* SECCIÓN DE USUARIO */}
                <div className="px-3 py-4 border-t border-slate-700/50 bg-slate-900/50">
                     <div className={`flex items-center ${isSidebarOpen ? 'gap-x-3 px-3' : 'justify-center'}`}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white shadow-lg border border-white/10 flex-shrink-0">
                            {profile?.nombre_completo?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        {isSidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate leading-tight">{profile?.nombre_completo || user?.email}</p>
                                <p className="text-[10px] font-medium text-slate-400 truncate">{profile?.role || 'Usuario'}</p>
                            </div>
                        )}
                         <button 
                            onClick={handleSignOut} 
                            title="Cerrar sesión" 
                            className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
                        >
                            <FaSignOutAlt className="text-lg" />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;