import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createProject } from '../../services/projects'; 
import { useAuth } from '../../contexts/AuthContext'; 
import { UI } from '../../utils/design';
import { FaArrowLeft, FaCube, FaCheck, FaSpinner, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const ProjectCreate = () => {
    const navigate = useNavigate();
    const { currentTeam, loading: authLoading } = useAuth(); 

    const [formData, setFormData] = useState({
        nombre: '',
        sigla_bug: '',
        descripcion: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'sigla_bug') {
            const formatted = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
            setFormData(prev => ({ ...prev, [name]: formatted }));
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.nombre.trim() || !formData.sigla_bug.trim()) {
            setError('El nombre y la sigla son obligatorios.');
            return;
        }
        
        if (formData.sigla_bug.length < 2) {
            setError('La sigla debe tener al menos 2 letras.');
            return;
        }

        if (!currentTeam || !currentTeam.id) {
            setError('Error crítico: No tienes un equipo asignado.');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createProject({
                ...formData,
                teamId: currentTeam.id 
            });

            if (result.success) {
                navigate('/proyectos');
            } else {
                setError(result.error || 'No se pudo crear el proyecto.');
            }
        } catch (err) {
            console.error(err);
            setError('Ocurrió un error inesperado.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) return <div className="flex justify-center p-20"><FaSpinner className="animate-spin text-3xl text-indigo-600"/></div>;

    if (!currentTeam) {
        return (
            <div className={UI.PAGE_CONTAINER}>
                <div className={`${UI.CARD_BASE} p-10 text-center max-w-2xl mx-auto mt-10 bg-red-50 border-red-100`}>
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        <FaExclamationTriangle />
                    </div>
                    <h2 className="text-xl font-bold text-red-800 mb-2">Se requiere un Equipo</h2>
                    <p className="text-red-600 mb-6">Primero debes pertenecer a un equipo o crear uno nuevo.</p>
                    <Link to="/equipos" className={UI.BTN_PRIMARY}>Ir a Gestión de Equipos</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Panel Izquierdo */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[400px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl mb-6 border border-white/20 shadow-xl">
                            <span role="img" aria-label="icon">🚀</span>
                        </div>
                        {/* FIX: Texto en blanco explícito */}
                        <h1 className="text-3xl font-bold mb-4 text-white">Nuevo Proyecto</h1>
                        <p className="text-slate-300 leading-relaxed text-lg">
                            Espacio de trabajo dedicado en el equipo <strong className="text-white">{currentTeam.nombre}</strong>.
                        </p>
                    </div>
                    {/* Previsualización */}
                    <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-8">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Vista previa</h3>
                        <div className="bg-white rounded-xl p-4 shadow-lg flex items-center gap-3">
                            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-sm border border-indigo-100">
                                {formData.sigla_bug || 'ABC'}-101
                            </span>
                            <div className="flex-1 space-y-2">
                                <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                                <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        </div>
                    </div>
                </div>

                {/* Panel Derecho */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <Link to="/proyectos" className="text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-2 transition-colors">
                            <FaArrowLeft className="text-xs"/> Cancelar y Volver
                        </Link>
                    </div>
                    <div className={`${UI.CARD_BASE} p-8`}>
                        {error && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-3 font-medium animate-shake">
                                <FaExclamationTriangle /> {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><FaCube className="text-indigo-500"/> Nombre del Proyecto</label>
                                <input type="text" name="nombre" className={UI.INPUT_TEXT} placeholder="Ej: Rediseño Web" value={formData.nombre} onChange={handleChange} autoFocus required />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><span className="text-indigo-500 font-mono text-lg">~</span> Sigla del Bug</label>
                                    <span className={`text-xs font-bold ${formData.sigla_bug.length === 5 ? 'text-amber-500' : 'text-slate-400'}`}>{formData.sigla_bug.length}/5</span>
                                </div>
                                <div className="relative">
                                    <input type="text" name="sigla_bug" className={`${UI.INPUT_TEXT} font-mono tracking-wider uppercase pl-4 pr-10`} placeholder="Ej: WEB" value={formData.sigla_bug} onChange={handleChange} required maxLength={5} />
                                    {formData.sigla_bug.length >= 2 && <FaCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">Descripción</label>
                                <textarea name="descripcion" className={`${UI.INPUT_TEXT} min-h-[120px] resize-none`} placeholder="Descripción opcional..." value={formData.descripcion} onChange={handleChange} />
                            </div>
                            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
                                <Link to="/proyectos" className={UI.BTN_SECONDARY}>Cancelar</Link>
                                <button type="submit" disabled={isSubmitting} className={`${UI.BTN_PRIMARY} px-8 py-3`}>{isSubmitting ? <><FaSpinner className="animate-spin" /> Creando...</> : 'Crear Proyecto'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectCreate;