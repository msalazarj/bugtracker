// src/pages/Teams/TeamDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';

const TeamDetail = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !teamId) return;

    setLoading(true);
    const docRef = doc(db, "teams", teamId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const teamData = docSnap.data();
        if (teamData.members && teamData.members.includes(user.uid)) {
          setTeam({ id: docSnap.id, ...teamData });
        } else {
          setTeam(null);
        }
      } else {
        setTeam(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error al cargar el equipo (TeamDetail):", error.message);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [teamId, user]);

  if (loading) {
    return <div className="p-6 text-center">Cargando detalle del equipo...</div>;
  }

  if (!team) {
    return <div className="p-6 text-center text-red-500">Acceso denegado o el equipo no existe.</div>;
  }

  return (
    <div className="p-4 sm:p-6">
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-900">{team.nombre}</h1>
            <p className="mt-4"><strong>Miembros:</strong> {team.members.length}</p>
        </div>
    </div>
  );
};

export default TeamDetail;
