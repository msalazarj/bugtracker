// src/pages/Teams/TeamList.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { FaPlus, FaShieldAlt } from 'react-icons/fa';

const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // Consulta segura: pide equipos donde el UID del usuario esté en el array 'members'.
    const q = query(collection(db, "teams"), where("members", "array-contains", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(teamsData);
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar equipos (TeamList):", error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const TeamCard = ({ team }) => (
    <Link to={`/equipos/${team.id}`} className="block p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
        <h3 className="font-bold text-lg text-gray-800">{team.nombre}</h3>
        <p className="text-sm text-gray-500 mt-1">{team.members?.length || 0} miembros</p>
    </Link>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Equipos</h1>
            <Link to="/equipos/crear" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-sm hover:bg-indigo-700">
                <FaPlus className="mr-2"/> Nuevo Equipo
            </Link>
        </div>

        {loading ? (
            <div className="text-center py-10">Cargando equipos...</div>
        ) : teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {teams.map(team => <TeamCard key={team.id} team={team} />)}
            </div>
        ) : (
            <div className="text-center bg-white p-10 rounded-lg shadow-sm">
                <FaShieldAlt className="mx-auto text-4xl text-gray-300"/>
                <h3 className="mt-4 text-lg font-bold text-gray-800">No hay equipos.</h3>
                <p className="mt-2 text-sm text-gray-500">Crea un equipo para empezar a colaborar.</p>
            </div>
        )}
    </div>
  );
};

export default TeamList;
