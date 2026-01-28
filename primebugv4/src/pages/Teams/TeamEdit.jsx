// src/pages/Teams/TeamEdit.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaSave, FaTimes, FaUsers, FaAlignLeft } from 'react-icons/fa';

const TeamEdit = () => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { id: teamId } = useParams();

  // 1. Cargar datos del equipo desde Firestore
  useEffect(() => {
    const loadTeamData = async () => {
      if (!teamId) return;
      setIsLoading(true);
      try {
        const docRef = doc(db, "teams", teamId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setNombre(data.nombre || '');
          setDescripcion(data.descripcion || '');
        } else {
          setError("El equipo que intentas editar no existe.");
        }
      } catch (err) {
        console.error("Error al cargar el equipo:", err);
        setError("Error de conexión con la base de datos.");
      } finally {
        setIsLoading(false);
      }
    };
    loadTeamData();
  }, [teamId]);

  // 2. Guardar cambios en Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del equipo es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const docRef = doc(db, "teams", teamId);
      await updateDoc(docRef, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        actualizado_en: serverTimestamp() // Auditoría de cambios
      });

      navigate(`/equipos/${teamId}`);
    } catch (err) {
      setError('No se pudieron guardar los cambios. Inténtalo de nuevo.');
      console.error("Error actualizando equipo:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <span className="ml-3 font-bold text-indigo-600">Cargando equipo...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 animate-fade-in">
      <h1 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">Editar Equipo</h1>
      
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded text-sm font-medium">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="nombre" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Nombre del Equipo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaUsers className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Nombre del equipo"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label htmlFor="descripcion" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Descripción
            </label>
            <div className="relative">
              <FaAlignLeft className="absolute top-4 left-3 text-gray-400" />
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px] transition-all"
                placeholder="Propósito del equipo..."
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-50">
            <Link 
              to={`/equipos/${teamId}`} 
              className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-gray-300 disabled:shadow-none transition-all flex items-center"
              disabled={isSubmitting}
            >
              <FaSave className="mr-2" />
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamEdit;