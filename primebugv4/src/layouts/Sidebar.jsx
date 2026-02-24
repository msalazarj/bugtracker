import React, { useEffect, useState } from 'react';

import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext.jsx';

import { doc, getDoc } from 'firebase/firestore';

import { db } from '../firebase';

import {

    FaChartPie, FaUsers, FaFolderOpen, FaBug,

    FaChevronDown, FaArrowLeft, FaFileAlt, FaSignOutAlt,

    FaChartLine, FaTimes

} from 'react-icons/fa';



const Sidebar = ({ isOpen, setIsOpen }) => {

    const { logout, user, currentTeam, userTeams, switchTeam } = useAuth();

    const location = useLocation();

    const navigate = useNavigate();

    const [projectName, setProjectName] = useState('');



    const pathSegments = location.pathname.split('/');

    const projectsIndex = pathSegments.indexOf('proyectos');

    const projectId = (projectsIndex !== -1 && pathSegments.length > projectsIndex + 1 && pathSegments[projectsIndex + 1] !== 'crear')

        ? pathSegments[projectsIndex + 1] : null;



    useEffect(() => {

        const fetchProjectName = async () => {

            if (projectId) {

                const cachedName = sessionStorage.getItem(`sidebar_pname_${projectId}`);

                if (cachedName) { setProjectName(cachedName); return; }

                try {

                    const docRef = doc(db, 'projects', projectId);

                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {

                        const name = docSnap.data().nombre;

                        setProjectName(name);

                        sessionStorage.setItem(`sidebar_pname_${projectId}`, name);

                    }

                } catch (error) {}

            }

        };

        fetchProjectName();

    }, [projectId]);



    const handleSignOut = async () => {

        try { await logout(); navigate('/login'); } catch (error) {}

    };



    const isActive = (path, exact = false) => {

        if (exact) return location.pathname === path;

        return location.pathname === path || location.pathname.startsWith(path + '/');

    };



    const globalMenu = [

        { path: '/dashboard', label: 'Dashboard', icon: <FaChartPie /> },

        { path: '/equipos', label: 'Mis Equipos', icon: <FaUsers /> },

        { path: '/proyectos', label: 'Proyectos', icon: <FaFolderOpen /> },

        { path: '/reportes', label: 'Reportes', icon: <FaChartLine /> },

    ];



    const projectMenu = [

        { path: `/proyectos/${projectId}`, label: 'Resumen', icon: <FaChartPie />, exact: true },

        { path: `/proyectos/${projectId}/bugs`, label: 'Tablero de Bugs', icon: <FaBug /> },

        { path: `/proyectos/${projectId}/miembros`, label: 'Equipo', icon: <FaUsers /> },

        { path: `/proyectos/${projectId}/documentacion`, label: 'Documentación', icon: <FaFileAlt /> },

    ];



    return (

        <>

            {/* OVERLAY (Fondo oscuro para móviles) */}

            {isOpen && (

                <div

                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] lg:hidden animate-fade-in"

                    onClick={() => setIsOpen(false)}

                />

            )}



            <aside className={`

                fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col

                border-r border-slate-800 shadow-xl z-[55] transition-transform duration-300 ease-in-out

                ${isOpen ? 'translate-x-0' : '-translate-x-full'}

                lg:translate-x-0

            `}>

                {/* HEADER */}

                <div className="p-5 border-b border-slate-800 bg-slate-900">

                    <div className="flex items-center justify-between mb-4">

                        <div className="flex items-center gap-3">

                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-lg shadow-lg">

                                <FaBug />

                            </div>

                            <h1 className="text-white font-bold text-lg tracking-tight">PrimeBug</h1>

                        </div>

                        {/* Botón de cerrar solo en móviles */}

                        <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-500 hover:text-white p-1">

                            <FaTimes size={18} />

                        </button>

                    </div>



                    <div className="relative">

                        <select

                            value={currentTeam?.id || ''}

                            onChange={(e) => switchTeam(e.target.value)}

                            className="w-full bg-slate-800 text-white text-sm font-medium py-2 px-3 rounded-lg border border-slate-700 appearance-none cursor-pointer"

                        >

                            {userTeams.length > 0 ? (

                                userTeams.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)

                            ) : ( <option>Sin Equipo</option> )}

                        </select>

                        <FaChevronDown className="absolute right-3 top-3 text-xs text-slate-400 pointer-events-none"/>

                    </div>

                </div>



                {/* NAV */}

                <nav className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">

                    {projectId ? (

                        <div className="flex-1 bg-slate-800/30">

                            <div className="bg-gradient-to-b from-slate-800 to-slate-900/50 border-b border-slate-700/50 p-4 border-l-4 border-l-indigo-500">

                                <Link to="/proyectos" onClick={() => setIsOpen(false)} className="text-[10px] text-indigo-400 hover:text-white uppercase tracking-widest font-bold flex items-center gap-1 mb-2">

                                    <FaArrowLeft /> Volver al listado

                                </Link>

                                <h2 className="text-white font-bold leading-tight text-lg truncate">{projectName || 'Proyecto'}</h2>

                            </div>

                            <div className="p-3 space-y-1">

                                {projectMenu.map((item) => (

                                    <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm ${isActive(item.path, item.exact) ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>

                                        {item.icon} <span>{item.label}</span>

                                    </Link>

                                ))}

                            </div>

                        </div>

                    ) : (

                        <div className="space-y-1 p-3">

                            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Menú Principal</p>

                            {globalMenu.map((item) => (

                                <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${isActive(item.path) ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>

                                    {item.icon} <span>{item.label}</span>

                                </Link>

                            ))}

                        </div>

                    )}

                </nav>



                {/* FOOTER */}

                <div className="p-4 border-t border-slate-800 bg-slate-900">

                    <div className="flex items-center justify-between">

                        <Link to="/perfil" onClick={() => setIsOpen(false)} className="flex items-center gap-3 flex-1 hover:bg-slate-800 p-2 rounded-lg -ml-2">

                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border-2 border-slate-600 uppercase">

                                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}

                            </div>

                            <p className="text-sm font-bold text-white truncate w-24">{user?.displayName || 'Usuario'}</p>

                        </Link>

                        <button onClick={handleSignOut} className="p-2 text-slate-400 hover:text-red-400"><FaSignOutAlt /></button>

                    </div>

                </div>

            </aside>

        </>

    );

};



export default Sidebar;