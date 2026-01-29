// src/pages/Teams/TeamCreate.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaUsers, FaArrowLeft } from 'react-icons/fa';

const TeamCreate = () => {
    const [nombre, setNombre] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth(); // Se elimina la dependencia directa de `profile`
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
            // Obtener el perfil del usuario directamente para asegurar datos frescos
            const profileRef = doc(db, 'profiles', user.uid);
            const profileSnap = await getDoc(profileRef);

            if (!profileSnap.exists()) {
                throw new Error("No se pudo encontrar el perfil del usuario.");
            }
            const userProfile = profileSnap.data();

            const teamData = {
                nombre: nombre.trim(),
                ownerId: user.uid,
                createdAt: serverTimestamp(),
                members: [user.uid], // Requerido por la regla de seguridad
                members_roles: {
                    [user.uid]: {
                        role: 'Owner',
                        displayName: userProfile.nombre_completo, // Dato obtenido al momento
                        email: user.email
                    }
                }
            };

            await addDoc(collection(db, 'teams'), teamData);
            navigate('/equipos');

        } catch (err) {
            console.error("Error al crear el equipo:", err);
            setError('No se pudo crear el equipo. Revisa las reglas de seguridad y la conexión.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
             <div className="mb-6">
                <Link to="/equipos" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                    <FaArrowLeft />
                    Volver a Equipos
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="px-6 py-5 sm:px-8 border-b border-slate-200">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                             <FaUsers className="text-indigo-500 w-6 h-6" />
                        </div>
                        <div>
                             <h1 className="text-xl font-bold text-slate-800">Crear un Nuevo Equipo</h1>
                             <p className="text-sm text-slate-500">Define un nombre para tu equipo y empieza a colaborar.</p>
                        </div>
                     </div>
                </div>
                
                <form onSubmit={handleSubmit} noValidate>
                    <div className="p-6 sm:p-8 space-y-4">
                        <div>
                            <label htmlFor="team-name" className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre del Equipo</label>
                            <input
                                type="text"
                                id="team-name"
                                className="input-text w-full"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej: Equipo de Marketing Digital"
                                required
                            />
                        </div>
                         {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>

                    <div className="px-6 sm:px-8 py-4 bg-slate-50/70 border-t border-slate-200 flex justify-end items-center gap-x-3">
                        <button type="button" onClick={() => navigate(-1)} className="btn-secondary px-4 py-2 text-sm font-medium">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center justify-center gap-x-2 px-4 py-2 text-sm font-medium">
                            {isSubmitting ? 'Creando...' : 'Crear Equipo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeamCreate;