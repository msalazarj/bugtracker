// src/pages/Projects/ProjectCreate.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';

const ProjectCreate = () => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth(); // Obtener el usuario actual

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre) {
      setError('El nombre del proyecto es obligatorio.');
      return;
    }
    if (!user) {
        setError("Debes estar autenticado para crear un proyecto.");
        return;
    }

    setLoading(true);
    setError('');

    try {
      // Añadir el proyecto a Firestore
      await addDoc(collection(db, 'projects'), {
        nombre,
        descripcion,
        ownerId: user.uid, // Guardar el ID del creador
        members: [user.uid], // Añadir al creador como el primer miembro
        createdAt: serverTimestamp(),
      });
      navigate('/proyectos'); // Redirigir a la lista de proyectos
    } catch (err) {
      console.error("Error al crear el proyecto (ProjectCreate):", err.message);
      setError('Hubo un error al crear el proyecto. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Nuevo Proyecto</h1>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="nombre" className="block text-sm font-bold text-gray-600 mb-2">Nombre del Proyecto</label>
                    <input 
                        type="text" 
                        id="nombre" 
                        value={nombre} 
                        onChange={(e) => setNombre(e.target.value)} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="descripcion" className="block text-sm font-bold text-gray-600 mb-2">Descripción</label>
                    <textarea 
                        id="descripcion" 
                        rows="4" 
                        value={descripcion} 
                        onChange={(e) => setDescripcion(e.target.value)} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creando...' : 'Crear Proyecto'}
                </button>
            </form>
        </div>
    </div>
  );
};

export default ProjectCreate;
