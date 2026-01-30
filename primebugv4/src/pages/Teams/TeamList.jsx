// src/pages/Teams/TeamList.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { FaPlus, FaUsers, FaFolder } from 'react-icons/fa';

// --- Skeleton Loader para las tarjetas ---
const CardSkeleton = () => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-3/4 mb-4"></div>
        <div className="flex items-center justify-between">
            <div className="flex -space-x-3">
                <div className="w-9 h-9 bg-slate-200 rounded-full ring-2 ring-white"></div>
                <div className="w-9 h-9 bg-slate-200 rounded-full ring-2 ring-white"></div>
                <div className="w-9 h-9 bg-slate-200 rounded-full ring-2 ring-white"></div>
            </div>
            <div className="flex gap-x-4">
                <div className="h-5 w-8 bg-slate-200 rounded"></div>
                <div className="h-5 w-8 bg-slate-200 rounded"></div>
            </div>
        </div>
    </div>
);

// --- Helper para obtener iniciales de un nombre ---
const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0]?.[0] || '').toUpperCase();
};

// --- Tarjeta de Equipo Rediseñada ---
const TeamCard = ({ team }) => {
    const members = Object.values(team.members_roles || {});
    const memberCount = members.length;
    const projectCount = team.projects?.length || 0;
    const displayedMembers = members.slice(0, 3);

    return (
        <Link to={`/equipos/${team.id}`} className="block bg-white p-5 rounded-xl shadow-sm border border-transparent transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-400">
            <h3 className="font-bold text-slate-800 truncate text-md mb-4">{team.nombre}</h3>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center" title={`${memberCount} miembros`}>
                    <div className="flex -space-x-3 overflow-hidden">
                        {displayedMembers.map((member, index) => (
                            <div key={member.email || index} title={member.displayName} className="inline-flex items-center justify-center h-9 w-9 rounded-full ring-2 ring-white bg-indigo-100 text-indigo-600 font-bold text-xs">
                                {getInitials(member.displayName)}
                            </div>
                        ))}
                         {memberCount === 0 && (
                            <div className="inline-flex items-center justify-center h-9 w-9 rounded-full ring-2 ring-white bg-slate-100 text-slate-400 font-bold text-xs">
                                <FaUsers />
                            </div>
                         )}
                    </div>
                    {memberCount > 3 && <span className="pl-3 text-sm font-medium text-slate-500">+{memberCount - 3}</span>}
                </div>

                <div className="flex gap-x-4 text-sm font-medium">
                    <div className="flex items-center gap-x-1.5 text-slate-500" title={`${memberCount} Miembros`}>
                        <FaUsers className="text-slate-400" />
                        <span>{memberCount}</span>
                    </div>
                    <div className="flex items-center gap-x-1.5 text-slate-500" title={`${projectCount} Proyectos`}>
                        <FaFolder className="text-slate-400" />
                        <span>{projectCount}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};


const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, "teams"), where("members", "array-contains", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(teamsData);
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar equipos (TeamList):", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-800">Equipos</h1>
            <Link to="/equipos/crear" className="btn-primary flex items-center justify-center gap-x-2 px-4 py-2 text-sm font-medium whitespace-nowrap">
                <FaPlus /> Crear Equipo
            </Link>
        </div>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
        ) : teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {teams.map(team => <TeamCard key={team.id} team={team} />)}
            </div>
        ) : (
            <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-slate-100 mt-10">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 mx-auto rounded-full flex items-center justify-center mb-5">
                    <FaUsers className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No tienes equipos asignados</h3>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">Para empezar a colaborar en proyectos, crea un nuevo equipo o pide que te inviten a uno existente.</p>
                 <Link to="/equipos/crear" className="btn-primary mt-6 inline-flex items-center justify-center gap-x-2 px-4 py-2 text-sm font-medium">
                    <FaPlus /> Crear tu primer equipo
                </Link>
            </div>
        )}
    </div>
  );
};

export default TeamList;