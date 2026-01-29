// src/pages/Projects/ProjectCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FaProjectDiagram, FaTag, FaUsers, FaCalendarAlt, FaUserTie, FaSave, FaTimes, FaSpinner } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Estilos del editor

const FormField = ({ label, children, error }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
        {children}
        {error && <p className="text-red-600 text-xs mt-1 font-semibold">{error}</p>}
    </div>
);

const ProjectCreate = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // State
    const [formData, setFormData] = useState({
        nombre: '',
        sigla_incidencia: '',
        descripcion: '',
        teamId: '', // ¡NUEVO! Para asociar a un equipo
        manager_id: '',
        fecha_inicio: '',
        fecha_fin: '',
    });
    const [teams, setTeams] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    // Cargar equipos del usuario al montar
    useEffect(() => {
        const loadUserTeams = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const teamsQuery = query(collection(db, 'teams'), where(`members.${user.uid}`, '>', ''));
                const querySnapshot = await getDocs(teamsQuery);
                const userTeams = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTeams(userTeams);
            } catch (err) {
                console.error("Error al cargar equipos:", err);
                setError("No se pudieron cargar tus equipos.");
            }
            setIsLoading(false);
        };
        loadUserTeams();
    }, [user]);

    // Cargar miembros cuando se selecciona un equipo
    useEffect(() => {
        const loadTeamMembers = async () => {
            if (!formData.teamId) {
                setTeamMembers([]);
                setFormData(prev => ({ ...prev, manager_id: '' }));
                return;
            }
            try {
                const selectedTeam = teams.find(t => t.id === formData.teamId);
                if (selectedTeam && selectedTeam.members) {
                    const memberUIDs = Object.keys(selectedTeam.members);
                    const profilesQuery = query(collection(db, 'profiles'), where('__name__', 'in', memberUIDs));
                    const profilesSnap = await getDocs(profilesQuery);
                    setTeamMembers(profilesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                }
            } catch (err) {
                console.error("Error al cargar miembros del equipo:", err);
                setError("No se pudieron cargar los miembros del equipo seleccionado.");
            }
        };
        loadTeamMembers();
    }, [formData.teamId, teams]);

    const handleChange = (name, value) => {
        let processedValue = value;
        if (name === 'sigla_incidencia') {
            processedValue = value.toUpperCase().replace(/\s+/g, '').slice(0, 6);
        }
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
        if (!formData.sigla_incidencia.trim()) errors.sigla_incidencia = "La sigla es obligatoria.";
        if (!formData.teamId) errors.teamId = "Debes seleccionar un equipo.";
        if (formData.fecha_inicio && formData.fecha_fin && new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
            errors.fecha_fin = "La fecha límite no puede ser anterior a la de inicio.";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm() || !user) {
            if (!user) setError("Tu sesión ha expirado.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Obtener todos los miembros del equipo para asignarlos al proyecto
            const selectedTeam = teams.find(t => t.id === formData.teamId);
            const projectMembers = selectedTeam ? Object.keys(selectedTeam.members) : [user.uid];
            const managerProfile = teamMembers.find(m => m.id === formData.manager_id);

            await addDoc(collection(db, "projects"), {
                ...formData,
                descripcion: formData.descripcion || '',
                estado: 'Planeado',
                ownerId: user.uid,
                members: projectMembers,
                manager_nombre: managerProfile?.nombre_completo || 'Sin asignar',
                creado_en: serverTimestamp(),
                actualizado_en: serverTimestamp(),
            });

            navigate('/proyectos');
        } catch (err) {
            console.error("Error al crear proyecto:", err);
            setError(`Error al guardar: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) return <div className="text-center p-10"><FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto" /></div>;

    return (
        <div className="max-w-4xl mx-auto my-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <header className="px-6 py-4 bg-gray-50 border-b flex items-center">
                    <FaProjectDiagram className="text-indigo-600 mr-3" size="24" />
                    <h1 className="text-xl font-bold text-gray-800">Crear Nuevo Proyecto</h1>
                </header>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        {error && <div className="bg-red-100 p-4 rounded-md text-red-700">{error}</div>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Nombre del Proyecto" error={formErrors.nombre}>
                                <input type="text" value={formData.nombre} onChange={e => handleChange('nombre', e.target.value)} className="input-control w-full" placeholder="Ej: Plataforma E-commerce" />
                            </FormField>
                            <FormField label="Sigla para Tickets (max 6)" error={formErrors.sigla_incidencia}>
                                <input type="text" value={formData.sigla_incidencia} onChange={e => handleChange('sigla_incidencia', e.target.value)} className="input-control w-full" placeholder="ECOMM" />
                            </FormField>
                        </div>
                        
                        <FormField label="Descripción del Proyecto">
                            <ReactQuill theme="snow" value={formData.descripcion} onChange={value => handleChange('descripcion', value)} className="bg-white" />
                        </FormField>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                             <FormField label="Equipo Responsable" error={formErrors.teamId}>
                                <select value={formData.teamId} onChange={e => handleChange('teamId', e.target.value)} className="input-control w-full">
                                    <option value="">-- Selecciona un equipo --</option>
                                    {teams.map(team => <option key={team.id} value={team.id}>{team.nombre}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Project Manager">
                                <select value={formData.manager_id} onChange={e => handleChange('manager_id', e.target.value)} className="input-control w-full" disabled={!formData.teamId}>
                                    <option value="">-- Asignar un manager --</option>
                                    {teamMembers.map(member => <option key={member.id} value={member.id}>{member.nombre_completo}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Fecha de Inicio">
                                <input type="date" value={formData.fecha_inicio} onChange={e => handleChange('fecha_inicio', e.target.value)} className="input-control w-full" />
                            </FormField>
                            <FormField label="Fecha Límite" error={formErrors.fecha_fin}>
                                <input type="date" value={formData.fecha_fin} onChange={e => handleChange('fecha_fin', e.target.value)} className="input-control w-full" />
                            </FormField>
                        </div>
                    </div>

                    <footer className="flex justify-end items-center px-6 py-4 bg-gray-50 border-t space-x-3">
                        <button type="button" onClick={() => navigate('/proyectos')} className="btn-secondary">
                            <FaTimes className="mr-2" />
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary">
                            <FaSave className="mr-2" />
                            {isSubmitting ? 'Creando Proyecto...' : 'Guardar Proyecto'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default ProjectCreate;
