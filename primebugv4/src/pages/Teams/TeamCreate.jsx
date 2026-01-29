// src/pages/Teams/TeamCreate.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaUsers, FaSave, FaTimes } from 'react-icons/fa';

// InputField consistente con el resto de la aplicación
const InputField = React.forwardRef(({ ...props }, ref) => (
    <input
        ref={ref}
        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        {...props}
    />
));

const TeamCreate = () => {
    const [nombre, setNombre] = useState('');
    const [error, setError] = useState('');
    const { user, loading: authLoading } = useAuth(); // Renombramos loading para evitar conflictos
    const [isSubmitting, setIsSubmitting] = useState(false);
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
            await addDoc(collection(db, 'teams'), {
                nombre: nombre.trim(),
                ownerId: user.uid,
                members: [user.uid], // El creador siempre es miembro y dueño
                createdAt: serverTimestamp(),
            });
            navigate('/equipos'); // Idealmente, podrías mostrar un toast de éxito aquí
        } catch (err) {
            console.error("Error al crear el equipo:", err);
            setError('No se pudo crear el equipo. Inténtalo de nuevo más tarde.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Este componente está diseñado para ser renderizado dentro de un MainLayout
    return (
        <div className="max-w-2xl mx-auto my-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <header className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
                    <FaUsers className="text-indigo-600 mr-3" size="24" />
                    <h1 className="text-xl font-bold text-gray-800">Crear un Nuevo Equipo</h1>
                </header>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                                <p className="font-bold">Error</p>
                                <p>{error}</p>
                            </div>
                        )}
                        
                        <div>
                            <label htmlFor="team-name" className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Equipo</label>
                            <p className="text-sm text-gray-500 mb-2">Elige un nombre claro y descriptivo para tu equipo.</p>
                            <InputField
                                type="text"
                                id="team-name"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej: Equipo de Desarrollo Frontend"
                                required
                            />
                        </div>
                    </div>

                    <footer className="flex justify-end items-center px-6 py-4 bg-gray-50 border-t border-gray-200 space-x-3">
                        <button 
                            type="button"
                            onClick={() => navigate(-1)} // Vuelve a la página anterior
                            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <FaTimes className="mr-2" />
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || authLoading}
                            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                        >
                            <FaSave className="mr-2" />
                            {isSubmitting ? 'Creando Equipo...' : 'Guardar Equipo'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default TeamCreate;
