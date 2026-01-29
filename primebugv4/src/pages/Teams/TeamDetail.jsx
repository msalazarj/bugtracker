// src/pages/Teams/TeamDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaUsers, FaArrowLeft, FaCogs, FaProjectDiagram } from 'react-icons/fa';

// --- Sub-componente para las Tarjetas de Acción ---
const ActionCard = ({ to, icon, title, description, disabled = false }) => {
    const baseClasses = "block bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300";
    const enabledClasses = "hover:shadow-lg hover:-translate-y-1 hover:border-indigo-200";
    const disabledClasses = "opacity-50 cursor-not-allowed bg-slate-50";

    const content = (
        <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-lg text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500 mt-1">{description}</p>
            </div>
        </div>
    );

    if (disabled) {
        return <div className={`${baseClasses} ${disabledClasses}`}>{content}</div>;
    }

    return <Link to={to} className={`${baseClasses} ${enabledClasses}`}>{content}</Link>;
};


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
            {/* --- Encabezado -- */}
            <div className="space-y-4">
                <Link to="/equipos" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors w-fit">
                    <FaArrowLeft />
                    Volver a la lista de Equipos
                </Link>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h1 className="text-3xl font-bold text-slate-800">Panel del Equipo: {team.nombre}</h1>
                    <p className="text-slate-500 mt-2">Este es el centro de control para tu equipo. Desde aquí puedes acceder a todas las funcionalidades clave.</p>
                </div>
            </div>

            {/* --- Cuadrícula de Tarjetas de Acción -- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ActionCard 
                    to={`/equipos/${teamId}/miembros`}
                    icon={<FaUsers size={24} />}
                    title="Gestionar Miembros"
                    description={`Añade o elimina miembros. Actualmente hay ${team.members?.length || 0} personas.`}
                />
                <ActionCard 
                    to={`#`}
                    icon={<FaProjectDiagram size={24} />}
                    title="Proyectos del Equipo"
                    description="Visualiza y gestiona todos los proyectos asignados a este equipo."
                    disabled={true} 
                />
                <ActionCard 
                    to={`#`}
                    icon={<FaCogs size={24} />}
                    title="Configuración del Equipo"
                    description="Edita el nombre, la descripción y otras propiedades del equipo."
                    disabled={true} 
                />
            </div>
        </div>
    );
};

export default TeamDetail;
