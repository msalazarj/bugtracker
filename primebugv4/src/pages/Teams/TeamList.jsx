// src/pages/Teams/TeamList.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { FaPlus, FaUsers, FaFolder } from 'react-icons/fa';

// Skeleton Loader para las tarjetas
const CardSkeleton = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
        <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-slate-200 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-slate-200 rounded-full border-2 border-white"></div>
            </div>
            <div className="h-5 bg-slate-200 rounded w-1/4"></div>
        </div>
    </div>
);

// Tarjeta de Equipo Rediseñada
const TeamCard = ({ team }) => {
    const memberCount = team.members?.length || 0;
    // Simulación de avatares. En una app real, aquí irían las URLs de las imágenes.
    const avatars = Array(Math.min(memberCount, 3)).fill(0);

    return (
        <Link to={`/equipos/${team.id}`} className="block bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <h3 className="font-bold text-lg text-slate-800 truncate">{team.nombre}</h3>
            
            <div className="flex items-center justify-between mt-4">
                {/* Avatar Stack */}
                <div className="flex items-center">
                    <div className="flex -space-x-2 overflow-hidden">
                        {avatars.map((_, index) => (
                            <div key={index} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">{/* Podría ser una imagen */}</div>
                        ))}
                    </div>
                    {memberCount > 3 && <span className="pl-2 text-sm font-medium text-slate-500">+{memberCount - 3}</span>}
                </div>

                {/* Stats */}
                <div className="flex gap-x-4 text-sm">
                    <div className="flex items-center gap-x-1.5 text-slate-500">
                        <FaUsers className="text-slate-400" />
                        <span className="font-medium">{memberCount}</span>
                    </div>
                    {/* El conteo de proyectos podría venir de otra consulta */}
                    {/* <div className="flex items-center gap-x-1.5 text-slate-500">
                        <FaFolder className="text-slate-400" />
                        <span className="font-medium">{team.projectCount || 0}</span>
                    </div> */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
        ) : teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
