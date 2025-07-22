// src/pages/Teams/TeamEdit.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getTeamById, updateTeam } from '../../services/teams';
// COMENTARIO: Se importan los íconos para los campos de texto
import { FaSave, FaTimes, FaUsers, FaAlignLeft } from 'react-icons/fa';

const TeamEdit = () => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { id: teamId } = useParams();

  useEffect(() => {
    const loadTeamData = async () => {
      setIsLoading(true);
      const response = await getTeamById(teamId);
      if (response.success) {
        setNombre(response.data.team.nombre);
        setDescripcion(response.data.team.descripcion);
      } else {
        setError("No se pudo cargar la información del equipo para editar.");
      }
      setIsLoading(false);
    };
    loadTeamData();
  }, [teamId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre) {
      setError('El nombre del equipo es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await updateTeam(teamId, { nombre, descripcion });
      if (response.success) {
        alert(`Equipo "${response.data.nombre}" actualizado exitosamente (simulación).`);
        navigate(`/equipos/${teamId}`);
      }
    } catch (err) {
      setError('Ocurrió un error al actualizar el equipo. Inténtalo de nuevo.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <div className="p-6 text-center">Cargando equipo...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Editar Equipo</h1>
      
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
          
          {/* COMENTARIO: Se añade un contenedor relativo y un ícono al campo de texto. */}
          <div className="mb-6">
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Equipo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaUsers className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input-field w-full pl-10" // Se añade padding izquierdo
                placeholder="Ej: Equipo de Desarrollo Frontend"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* COMENTARIO: Se añade un contenedor relativo y un ícono al área de texto. */}
          <div className="mb-8">
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (Opcional)
            </label>
            <div className="relative">
               <FaAlignLeft className="absolute top-3 left-3 text-gray-400" />
               <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="input-field w-full min-h-[100px] pl-10 pt-2" // Se añade padding
                placeholder="Describe el propósito o los objetivos de este equipo."
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          {/* COMENTARIO: Se aplican los estilos estándar a los botones. */}
          <div className="flex items-center justify-end space-x-4 border-t pt-6">
            <Link 
              to={`/equipos/${teamId}`} 
              className="btn-secondary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap hover:bg-red-600 hover:border-red-700 hover:text-white transition-colors duration-200"
            >
              <FaTimes className="mr-2" />
              Cancelar
            </Link>
            <button
              type="submit"
              className="btn-primary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap"
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