// src/pages/Teams/TeamDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaUsers, FaArrowLeft, FaProjectDiagram, FaEdit, FaSave, FaTimes, FaSpinner } from 'react-icons/fa';

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

    // --- State para la edición en línea ---
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [formData, setFormData] = useState({ nombre: '', descripcion: '' });

    useEffect(() => {
        const teamRef = doc(db, 'teams', teamId);
        const unsubscribe = onSnapshot(teamRef, (docSnap) => {
            if (docSnap.exists()) {
                const teamData = { id: docSnap.id, ...docSnap.data() };
                setTeam(teamData);
                // Inicializar el formulario con los datos del equipo
                setFormData({ nombre: teamData.nombre, descripcion: teamData.descripcion || '' });
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async () => {
        if (!formData.nombre.trim()) {
            alert("El nombre del equipo no puede estar vacío.");
            return;
        }
        setIsUpdating(true);
        const teamRef = doc(db, 'teams', teamId);
        try {
            await updateDoc(teamRef, {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim()
            });
            setIsEditing(false);
        } catch (err) {
            console.error("Error al actualizar el equipo:", err);
            alert("No se pudo guardar los cambios. Inténtalo de nuevo.");
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleCancelEdit = () => {
        // Revertir cambios al estado original
        setFormData({ nombre: team.nombre, descripcion: team.descripcion || '' });
        setIsEditing(false);
    };

    if (loading) return <div className="flex justify-center items-center h-64"><FaSpinner className="animate-spin text-4xl text-indigo-500"/></div>;
    if (error) return <div className="text-center py-10 text-red-600 bg-red-50 rounded-lg">{error}</div>;
    if (!team) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* --- Encabezado con edición en línea -- */}
            <div className="space-y-4">
                <Link to="/equipos" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors w-fit">
                    <FaArrowLeft />
                    Volver a la lista de Equipos
                </Link>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    {!isEditing ? (
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800">{team.nombre}</h1>
                                <p className="text-slate-500 mt-2 max-w-2xl">{team.descripcion || 'No hay descripción para este equipo. Añade una para dar más detalles.'}</p>
                            </div>
                            <button onClick={() => setIsEditing(true)} className="btn-secondary flex items-center gap-2 flex-shrink-0">
                                <FaEdit />
                                Editar
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="nombre" className="block text-sm font-bold text-slate-700 mb-1">Nombre del Equipo</label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        id="nombre"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        className="input-text w-full text-2xl font-bold"
                                        placeholder="Nombre del Equipo"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="descripcion" className="block text-sm font-bold text-slate-700 mb-1">Descripción</label>
                                    <textarea
                                        name="descripcion"
                                        id="descripcion"
                                        rows="3"
                                        value={formData.descripcion}
                                        onChange={handleInputChange}
                                        className="input-text w-full"
                                        placeholder="Añade una descripción para el equipo"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 mt-6">
                                <button onClick={handleCancelEdit} disabled={isUpdating} className="btn-secondary flex items-center gap-2">
                                    <FaTimes />
                                    Cancelar
                                </button>
                                <button onClick={handleSaveChanges} disabled={isUpdating} className="btn-primary flex items-center gap-2">
                                    {isUpdating ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                    {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Cuadrícula de Tarjetas de Acción -- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
        </div>
    );
};

export default TeamDetail;
