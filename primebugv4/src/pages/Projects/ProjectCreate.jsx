// src/pages/Projects/ProjectCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';

const ProjectCreate = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth(); // profile contiene el teamId
    
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        sigla_incidencia: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nombre || !formData.sigla_incidencia) {
            setError('El nombre del proyecto y la sigla son obligatorios.');
            return;
        }

        if (!profile?.teamId) {
            setError('No estás asignado a ningún equipo. No puedes crear proyectos.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await addDoc(collection(db, 'projects'), {
                ...formData,
                teamId: profile.teamId, // Asignar el teamId del perfil del usuario
                ownerId: user.uid,       // El creador es el dueño
                creado_en: serverTimestamp(),
                // CORRECCIÓN: Añadir al creador como miembro y Manager por defecto
                members: {
                    [user.uid]: { role: 'Manager' }
                }
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
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-2xl mx-auto">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Crear Nuevo Proyecto</h1>
            <p className="text-slate-500 mb-8">Completa los detalles a continuación para iniciar un nuevo proyecto.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="nombre" className="label">Nombre del Proyecto</label>
                    <input 
                        id="nombre" 
                        name="nombre" 
                        type="text" 
                        value={formData.nombre} 
                        onChange={handleChange} 
                        className="input"
                        placeholder="Ej: Sistema de Gestión de Clientes"
                        required 
                    />
                </div>

                <div>
                    <label htmlFor="sigla_incidencia" className="label">Sigla de Incidencia</label>
                    <input 
                        id="sigla_incidencia" 
                        name="sigla_incidencia" 
                        type="text" 
                        value={formData.sigla_incidencia} 
                        onChange={handleChange} 
                        className="input"
                        placeholder="Ej: SGC"
                        maxLength="5"
                        required 
                    />
                    <p className="form-hint">Un identificador corto (máx. 5 letras) para los tickets de este proyecto.</p>
                </div>

                <div>
                    <label htmlFor="descripcion" className="label">Descripción</label>
                    <textarea 
                        id="descripcion" 
                        name="descripcion" 
                        rows="4" 
                        value={formData.descripcion} 
                        onChange={handleChange} 
                        className="input"
                        placeholder="Describe brevemente el objetivo y alcance del proyecto."
                    />
                </div>
                
                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

                <div className="flex items-center justify-end gap-4 pt-4">
                    <button type="button" onClick={() => navigate('/proyectos')} className="btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary">
                        {isSubmitting ? 'Creando Proyecto...' : 'Crear Proyecto'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectCreate;
