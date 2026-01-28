// src/pages/Teams/TeamCreate.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';

const TeamCreate = () => {
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre) {
      setError('El nombre del equipo es obligatorio.');
      return;
    }
    if (!user) {
        setError("Debes estar autenticado para crear un equipo.");
        return;
    }

    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'teams'), {
        nombre,
        ownerId: user.uid,
        members: [user.uid], // El creador es el primer miembro
        createdAt: serverTimestamp(),
      });
      navigate('/equipos');
    } catch (err) {
      console.error("Error al crear el equipo (TeamCreate):", err.message);
      setError('Hubo un error al crear el equipo.');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Nuevo Equipo</h1>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="nombre" className="block text-sm font-bold text-gray-600 mb-2">Nombre del Equipo</label>
                    <input 
                        type="text" 
                        id="nombre" 
                        value={nombre} 
                        onChange={(e) => setNombre(e.target.value)} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? 'Creando...' : 'Crear Equipo'}
                </button>
            </form>
        </div>
    </div>
  );
};

export default TeamCreate;
