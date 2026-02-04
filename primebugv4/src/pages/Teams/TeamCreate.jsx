// src/pages/Teams/TeamCreate.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaUsers, FaBug, FaTimes } from 'react-icons/fa';

const TeamCreate = () => {
    const [nombre, setNombre] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nombre.trim()) {
            setError('El nombre del equipo es obligatorio.');
            return;
        }
        if (!user) {
            setError("Debes estar autenticado para crear un equipo.");
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await runTransaction(db, async (transaction) => {
                const profileRef = doc(db, 'profiles', user.uid);
                const profileSnap = await transaction.get(profileRef);

                if (!profileSnap.exists()) {
                    throw new Error("No se pudo encontrar tu perfil de usuario.");
                }
                if (profileSnap.data().teamId) {
                    throw new Error("Ya perteneces a un equipo. No puedes crear uno nuevo.");
                }

                const newTeamRef = doc(collection(db, 'teams'));
                
                // Estructura de datos corregida según el modelo
                const teamData = {
                    nombre: nombre.trim(),
                    ownerId: user.uid,
                    createdAt: serverTimestamp(),
                    members: {
                        [user.uid]: { role: 'Administrador' }
                    }
                };

                transaction.set(newTeamRef, teamData);
                transaction.update(profileRef, { teamId: newTeamRef.id });
            });

            await refreshProfile();
            navigate('/dashboard');

        } catch (err) {
            console.error("Error en transacción de creación de equipo:", err);
            setError(err.message || 'No se pudo crear el equipo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="split-page-layout">
            <Link to="/dashboard" className="absolute top-6 right-8 text-slate-400 hover:text-red-500 transition-colors z-20">
                <FaTimes size={24} />
            </Link>

            <div className="split-page-info-panel">
                <div className="info-panel-logo-container">
                    <div className="info-panel-logo-icon"><FaBug /></div>
                    <span>PrimeBug</span>
                </div>
                <h1 className="info-panel-title">Crea tu Equipo de Trabajo</h1>
                <p className="info-panel-description">
                    Centraliza la colaboración, gestiona miembros y asigna roles para organizar tu flujo de trabajo de manera eficiente.
                </p>
            </div>

            <div className="split-page-form-panel">
                <div className="split-page-form-container">
                    <form onSubmit={handleSubmit}>
                        <div className="form-field">
                            <label htmlFor="team-name" className="form-label">
                                <FaUsers className="form-label-icon" />
                                Nombre del Equipo
                            </label>
                            <input
                                id="team-name"
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="input-underlined"
                                placeholder="Ej: Equipo de Innovación"
                                required
                            />
                             <p className="form-hint">Este será el nombre de tu espacio de trabajo compartido.</p>
                        </div>
                        
                        {error && <p className="mt-6 text-sm text-red-600 bg-red-50 p-3 rounded-lg font-medium">{error}</p>}

                        <div className="flex items-center justify-end gap-4 pt-6">
                            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isSubmitting} className="btn-primary">
                                {isSubmitting ? 'Creando Equipo...' : 'Crear Equipo'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TeamCreate;
