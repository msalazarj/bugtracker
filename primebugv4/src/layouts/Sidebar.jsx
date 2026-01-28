// src/layouts/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext.jsx';
import { FaTachometerAlt, FaClipboardList, FaUsers, FaBug, FaPlus, FaSignOutAlt, FaAngleDown, FaProjectDiagram } from 'react-icons/fa';

const Sidebar = ({ isSidebarOpen }) => {
    const [projects, setProjects] = useState([]);
    const [showProjects, setShowProjects] = useState(true);
    const { user, profile, signOut } = useAuth(); // Usamos el perfil del contexto

    useEffect(() => {
        let unsubscribe;
        if (user) {
            // Espera a que `user` exista antes de hacer la consulta.
            const q = query(collection(db, "projects"), where("members", "array-contains", user.uid));
            
            unsubscribe = onSnapshot(q, (snapshot) => {
                const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProjects(projectsData);
            }, (error) => {
                // Este error es normal si el usuario acaba de registrarse y las reglas
                // de seguridad tardan en aplicarse.
                console.warn("Advertencia en Sidebar (puede ser temporal):", error.message);
            });
        }
        
        // Limpiar el listener al desmontar o si el usuario cambia
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user]); // La dependencia es solo `user`

    const navLinkClasses = "flex items-center px-4 py-2 text-sm font-bold text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors";
    const activeNavLinkClasses = "bg-gray-900 text-white";

    return (
        <aside className={`fixed top-0 left-0 h-full bg-gray-800 text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} shadow-xl z-10`}>
            <div className="flex flex-col h-full">
                {/* Logo y Nombre */}
                <div className="flex items-center justify-center h-20 border-b border-gray-700">
                    <FaBug className={`text-3xl text-indigo-400 ${isSidebarOpen ? 'mr-3' : ''}`}/>
                    {isSidebarOpen && <span className="text-xl font-bold whitespace-nowrap">PrimeBug</span>}
                </div>

                {/* Navegación Principal */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavLink to="/" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <FaTachometerAlt className={`text-lg ${isSidebarOpen ? 'mr-4' : 'mx-auto'}`} />
                        {isSidebarOpen && <span>Dashboard</span>}
                    </NavLink>
                    <NavLink to="/bugs" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <FaBug className={`text-lg ${isSidebarOpen ? 'mr-4' : 'mx-auto'}`} />
                        {isSidebarOpen && <span>Mis Bugs</span>}
                    </NavLink>
                    <NavLink to="/equipos" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <FaUsers className={`text-lg ${isSidebarOpen ? 'mr-4' : 'mx-auto'}`} />
                        {isSidebarOpen && <span>Equipos</span>}
                    </NavLink>

                    {/* Sección de Proyectos */}
                     <div className="pt-4">
                        <button onClick={() => setShowProjects(!showProjects)} className="w-full flex justify-between items-center px-4 py-2 text-sm font-bold text-gray-400 hover:text-white">
                            <div className="flex items-center">
                                <FaProjectDiagram className={`text-lg ${isSidebarOpen ? 'mr-4' : 'mx-auto'}`} />
                                {isSidebarOpen && <span>Proyectos</span>}
                            </div>
                            {isSidebarOpen && <FaAngleDown className={`transition-transform ${showProjects ? 'rotate-180' : ''}`} />}
                        </button>
                        {showProjects && isSidebarOpen && (
                            <div className="mt-2 space-y-1 pl-8 pr-4">
                                {projects.map(project => (
                                     // RUTA CORREGIDA: Apunta a la lista de issues del proyecto
                                    <NavLink key={project.id} to={`/proyectos/${project.id}/issues`} className={({ isActive }) => `block px-3 py-2 text-xs font-medium rounded-md hover:bg-gray-700 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                        {project.nombre}
                                    </NavLink>
                                ))}
                                <Link to="/proyectos/crear" className="flex items-center px-3 py-2 text-xs font-bold text-indigo-300 hover:text-indigo-200">
                                    <FaPlus className="mr-2" /> Nuevo Proyecto
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Footer del Sidebar */}
                <div className="px-4 py-4 border-t border-gray-700">
                    {isSidebarOpen ? (
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white">{profile?.nombre_completo || 'Cargando...'}</p>
                                <p className="text-xs text-gray-400">{user?.email}</p>
                            </div>
                            <button onClick={signOut} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700">
                                <FaSignOutAlt />
                            </button>
                        </div>
                    ) : (
                        <button onClick={signOut} className="w-full flex justify-center p-3 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700">
                            <FaSignOutAlt />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
