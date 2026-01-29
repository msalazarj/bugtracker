// src/pages/Teams/TeamDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaUsers, FaArrowLeft, FaCogs } from 'react-icons/fa';

const TeamDetail = () => {
    const { teamId } = useParams();
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const teamRef = doc(db, 'teams', teamId);
        const unsubscribe = onSnapshot(teamRef, (docSnap) => {
            if (docSnap.exists()) {
                setTeam({ id: docSnap.id, ...docSnap.data() });
            } else {
                setError("El equipo no fue encontrado.");
            }
            setLoading(false);
        }, (err) => {
            console.error("Error al cargar el equipo:", err);
            setError("No se pudo cargar el equipo.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [teamId]);

    if (loading) return <div className="text-center py-20">Cargando...</div>;
    if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
    if (!team) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="mb-6">
                 <Link to="/equipos" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                    <FaArrowLeft />
                    Volver a la lista de Equipos
                </Link>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">{team.nombre}</h1>
                    <p className="text-slate-500 mt-2">Este es el panel principal de tu equipo. Desde aquí puedes acceder a las diferentes secciones.</p>
                </div>
                <div className="flex-shrink-0">
                    <Link to={`/equipos/${teamId}/miembros`} className="btn-secondary inline-flex items-center gap-2 px-4 py-2">
                        <FaCogs/> Gestionar Miembros
                    </Link>
                </div>
            </div>

            {/* Placeholder for future content */}
            <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-700">Próximamente</h3>
                <p className="text-slate-500 mt-2">Más funcionalidades para la gestión de tu equipo aparecerán aquí.</p>
            </div>
        </div>
    );
};

export default TeamDetail;
