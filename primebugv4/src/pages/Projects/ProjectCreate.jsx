// src/pages/Projects/ProjectCreate.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaProjectDiagram, FaSignature, FaAlignLeft, FaBug, FaTimes } from 'react-icons/fa';

const ProjectCreate = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    
    const [formData, setFormData] = useState({ nombre: '', descripcion: '', sigla_incidencia: '' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'sigla_incidencia') {
            setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nombre.trim() || !formData.sigla_incidencia.trim()) {
            setError('El nombre del proyecto y la sigla son obligatorios.');
            return;
        }
        if (!profile?.teamId) {
            setError('No perteneces a ningún equipo para crear proyectos.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // --- CORRECCIÓN APLICADA AQUÍ ---
            // Se asegura que `members` se guarde como un array de UIDs, no como un mapa.
            await addDoc(collection(db, 'projects'), {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim(),
                sigla_incidencia: formData.sigla_incidencia.trim(),
                teamId: profile.teamId,
                ownerId: user.uid,
                creado_en: serverTimestamp(),
                members: [user.uid] // <-- ESTA ES LA LÍNEA CORREGIDA
            });
            navigate('/proyectos');
        } catch (err) {
            console.error("Error al crear proyecto:", err);
            setError('Hubo un problema al crear el proyecto.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="split-page-layout">
            <Link to="/proyectos" className="absolute top-6 right-8 text-slate-400 hover:text-red-500 transition-colors z-20">
                <FaTimes size={24} />
            </Link>

            <div className="split-page-info-panel">
                <div className="info-panel-logo-container">
                    <div className="info-panel-logo-icon"><FaBug /></div>
                    <span>PrimeBug</span>
                </div>
                <h1 className="info-panel-title">Inicia un Nuevo Proyecto</h1>
                <p className="info-panel-description">
                    Un proyecto bien definido es el primer paso para un seguimiento de incidencias exitoso. 
                    Define un nombre claro y una sigla única que identificará cada ticket.
                </p>
            </div>

            <div className="split-page-form-panel">
                <div className="split-page-form-container">
                    <form onSubmit={handleSubmit}>
                        <div className="form-field">
                            <label htmlFor="nombre" className="form-label">
                                <FaProjectDiagram className="form-label-icon" />
                                Nombre del Proyecto
                            </label>
                            <input id="nombre" name="nombre" type="text" value={formData.nombre} onChange={handleChange} className="input-underlined" placeholder="Ej: Plataforma de E-commerce" required />
                        </div>
                        <div className="form-field">
                            <label htmlFor="sigla_incidencia" className="form-label">
                                <FaSignature className="form-label-icon" />
                                Sigla de Incidencia
                            </label>
                            <input id="sigla_incidencia" name="sigla_incidencia" type="text" value={formData.sigla_incidencia} onChange={handleChange} className="input-underlined" placeholder="Ej: ECOV2" maxLength="5" required />
                            <p className="form-hint">Identificador corto y único (máx. 5 letras) para los tickets.</p>
                        </div>
                        <div className="form-field">
                            <label htmlFor="descripcion" className="form-label">
                                <FaAlignLeft className="form-label-icon" />
                                Descripción (Opcional)
                            </label>
                            <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} className="input-underlined" placeholder="Describe el objetivo principal y el alcance de este proyecto..." />
                        </div>
                        
                        {error && <p className="mt-6 text-sm text-red-600 bg-red-50 p-3 rounded-lg font-medium">{error}</p>}

                        <div className="flex items-center justify-end gap-4 pt-6">
                            <button type="button" onClick={() => navigate('/proyectos')} className="btn-secondary">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isSubmitting} className="btn-primary">
                                {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProjectCreate;
