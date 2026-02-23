import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createTeam } from '../../services/teams';
import { useAuth } from '../../contexts/AuthContext';

// --- DESIGN SYSTEM ---
import { UI } from '../../utils/design';
import { FaArrowLeft, FaUsers, FaSpinner, FaExclamationTriangle, FaCheckCircle, FaCrown } from 'react-icons/fa';

const TeamCreate = () => {
    const navigate = useNavigate();
    const { user, switchTeam } = useAuth(); // Necesitamos el usuario para la previsualización

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.nombre.trim()) {
            setError('El nombre del equipo es obligatorio.');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createTeam(formData);
            
            if (result.success) {
                // Opcional: Cambiar automáticamente al nuevo equipo creado
                // switchTeam(result.data.id); 
                navigate('/equipos');
            } else {
                setError(result.error || 'No se pudo crear el equipo.');
            }
        } catch (err) {
            console.error(err);
            setError('Ocurrió un error inesperado.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Panel Izquierdo: Info Visual */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[400px]">
                    {/* Efecto de fondo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl mb-6 border border-white/20 shadow-xl">
                            <span role="img" aria-label="icon">🏢</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-4 text-white">Nuevo Equipo</h1>
                        <p className="text-slate-300 leading-relaxed text-lg">
                            Crea un espacio centralizado para colaborar. Agrega miembros, gestiona múltiples proyectos y mantén todo organizado.
                        </p>
                    </div>

                    {/* Previsualización de la Tarjeta de Equipo */}
                    <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-8">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Vista previa</h3>
                        
                        {/* Simulación de Tarjeta */}
                        <div className="bg-white rounded-xl p-5 shadow-lg text-slate-800">
                            <div className="flex justify-between items-start mb-2">
                                {/* CORRECCIÓN 1: break-words en lugar de truncate para ver todo el nombre */}
                                <h4 className="font-bold text-lg text-indigo-700 break-words pr-2">
                                    {formData.nombre || 'Nombre del Equipo'}
                                </h4>
                                {user && (
                                    /* CORRECCIÓN 2: Rol en Español y shrink-0 para que no se aplaste */
                                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold border border-amber-200 shrink-0">
                                        <FaCrown size={8} /> Propietario
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-400 mb-4 line-clamp-2 min-h-[40px]">
                                {formData.descripcion || 'Descripción corta de tu espacio de trabajo...'}
                            </p>
                            <div className="flex items-center gap-3 text-xs font-medium text-slate-500 bg-slate-50 p-2 rounded-lg">
                                <FaUsers className="text-indigo-500"/>
                                <span>1 Miembro (Tú)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Formulario */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header Móvil / Navegación */}
                    <div className="flex items-center justify-between">
                        <Link to="/equipos" className="text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-2 transition-colors">
                            <FaArrowLeft className="text-xs"/> Cancelar y Volver
                        </Link>
                    </div>

                    <div className={`${UI.CARD_BASE} p-8`}>
                        {error && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-3 font-medium animate-shake">
                                <FaExclamationTriangle />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            
                            {/* Nombre */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <FaUsers className="text-indigo-500"/> Nombre del Equipo
                                </label>
                                <input 
                                    type="text" 
                                    name="nombre"
                                    className={UI.INPUT_TEXT} 
                                    placeholder="Ej: Desarrollo Mobile, Marketing, Finanzas..."
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    autoFocus
                                    required
                                />
                            </div>

                            {/* Descripción */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <span className="text-indigo-500 text-lg">≡</span> Descripción <span className="text-slate-400 font-normal text-xs ml-1">(Opcional)</span>
                                </label>
                                <textarea 
                                    name="descripcion"
                                    className={`${UI.INPUT_TEXT} min-h-[120px] resize-none`} 
                                    placeholder="¿Cuál es el propósito de este equipo?"
                                    value={formData.descripcion}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Info Box */}
                            <div className="bg-indigo-50 rounded-xl p-4 flex gap-3 text-indigo-800 text-sm">
                                <FaCheckCircle className="text-indigo-500 mt-0.5 flex-shrink-0" />
                                <p>
                                    {/* CORRECCIÓN 2: Uso consistente de Propietario */}
                                    Al crear un equipo, te convertirás automáticamente en el <strong>Propietario</strong>, lo que te permitirá invitar miembros y crear proyectos dentro de él.
                                </p>
                            </div>

                            {/* Botones */}
                            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
                                <Link to="/equipos" className={UI.BTN_SECONDARY}>
                                    Cancelar
                                </Link>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className={`${UI.BTN_PRIMARY} px-8 py-3`}
                                >
                                    {isSubmitting ? <><FaSpinner className="animate-spin" /> Creando...</> : 'Crear Equipo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamCreate;