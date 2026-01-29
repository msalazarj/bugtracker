// src/pages/Projects/ProjectCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaProjectDiagram, FaSave, FaTimes, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const FormField = ({ label, children, error }) => (
    <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
        {children}
        {error && <p className="text-red-600 text-xs mt-1 font-semibold">{error}</p>}
    </div>
);

const ProjectCreate = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [formData, setFormData] = useState({
        nombre: '',
        sigla_incidencia: '',
        descripcion: '',
        teamId: '',
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

    // 1. Cargar equipos del usuario (CORREGIDO)
    useEffect(() => {
        const loadUserTeams = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                // Consulta corregida para usar array-contains
                const teamsQuery = query(collection(db, 'teams'), where('members', 'array-contains', user.uid));
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

    // 2. Extraer miembros del equipo seleccionado (REFACTORIZADO Y CORREGIDO)
    useEffect(() => {
        if (!formData.teamId) {
            setTeamMembers([]);
            setFormData(prev => ({ ...prev, manager_id: '' }));
            return;
        }
        const selectedTeam = teams.find(t => t.id === formData.teamId);
        if (selectedTeam && selectedTeam.members_roles) {
            // Extraer miembros del mapa `members_roles` (eficiente)
            const members = Object.entries(selectedTeam.members_roles).map(([uid, data]) => ({ 
                id: uid, 
                nombre_completo: data.displayName 
            }));
            setTeamMembers(members);
        } else {
            setTeamMembers([]);
        }
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
            const selectedTeam = teams.find(t => t.id === formData.teamId);
            const managerProfile = teamMembers.find(m => m.id === formData.manager_id);

            await addDoc(collection(db, "projects"), {
                ...formData,
                descripcion: formData.descripcion || '',
                estado: 'Planeado',
                ownerId: user.uid,
                members: selectedTeam.members, // 3. Asignación correcta de miembros (CORREGIDO)
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
            <div className="mb-6">
                <Link to="/proyectos" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                    <FaArrowLeft />
                    Volver a Proyectos
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                <header className="px-6 py-5 border-b border-slate-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <FaProjectDiagram className="text-indigo-500 w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Crear Nuevo Proyecto</h1>
                        <p className="text-sm text-slate-500">Completa los detalles para iniciar un nuevo proyecto.</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 sm:p-8 space-y-6">
                        {error && <div className="bg-red-100 p-4 rounded-lg text-sm text-red-800">{error}</div>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Nombre del Proyecto" error={formErrors.nombre}>
                                <input type="text" value={formData.nombre} onChange={e => handleChange('nombre', e.target.value)} className="input-text w-full" placeholder="Ej: Plataforma E-commerce" />
                            </FormField>
                            <FormField label="Sigla para Tickets (max 6)" error={formErrors.sigla_incidencia}>
                                <input type="text" value={formData.sigla_incidencia} onChange={e => handleChange('sigla_incidencia', e.target.value)} className="input-text w-full" placeholder="ECOMM" />
                            </FormField>
                        </div>
                        
                        <FormField label="Descripción del Proyecto">
                            <ReactQuill theme="snow" value={formData.descripcion} onChange={value => handleChange('descripcion', value)} className="bg-white" />
                        </FormField>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                             <FormField label="Equipo Responsable" error={formErrors.teamId}>
                                <select value={formData.teamId} onChange={e => handleChange('teamId', e.target.value)} className="input-text w-full">
                                    <option value="">-- Selecciona un equipo --</option>
                                    {teams.map(team => <option key={team.id} value={team.id}>{team.nombre}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Project Manager">
                                <select value={formData.manager_id} onChange={e => handleChange('manager_id', e.target.value)} className="input-text w-full" disabled={!formData.teamId}>
                                    <option value="">-- Asignar un manager --</option>
                                    {teamMembers.map(member => <option key={member.id} value={member.id}>{member.nombre_completo}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Fecha de Inicio">
                                <input type="date" value={formData.fecha_inicio} onChange={e => handleChange('fecha_inicio', e.target.value)} className="input-text w-full" />
                            </FormField>
                            <FormField label="Fecha Límite" error={formErrors.fecha_fin}>
                                <input type="date" value={formData.fecha_fin} onChange={e => handleChange('fecha_fin', e.target.value)} className="input-text w-full" />
                            </FormField>
                        </div>
                    </div>

                    <footer className="flex justify-end items-center px-6 sm:px-8 py-4 bg-slate-50/70 border-t border-slate-200 gap-x-3">
                        <button type="button" onClick={() => navigate('/proyectos')} className="btn-secondary px-4 py-2 text-sm font-medium">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center justify-center gap-x-2 px-4 py-2 text-sm font-medium">
                            {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            {isSubmitting ? 'Creando...' : 'Guardar Proyecto'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default ProjectCreate;
