// src/pages/Projects/ProjectEdit.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getProfiles as fetchMockProfiles } from '../../services/profile';
import { getProjectById, updateProject } from '../../services/projects'; 
import { FaSave, FaTimes, FaProjectDiagram, FaTag, FaFileAlt, FaCalendarAlt, FaUserTie, FaCheckCircle } from 'react-icons/fa';

const ProjectEdit = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  
  const [formData, setFormData] = useState({
    nombre: '',
    sigla_incidencia: '',
    descripcion: '',
    estado: 'Planeado',
    fecha_inicio: '',
    fecha_fin: '',
    manager_id: '',
  });
  const [managers, setManagers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [projectResponse, profilesResponse] = await Promise.all([
          getProjectById(projectId),
          fetchMockProfiles()
        ]);

        // --- COMENTARIO: LÓGICA DE CARGA DE DATOS CORREGIDA ---
        // Se verifica que la respuesta sea exitosa (success: true) y se accede a la propiedad .data
        if (projectResponse && projectResponse.success) {
          const projectData = projectResponse.data;
          
          // Se formatea la data para los inputs de tipo 'date'
          const formattedData = {
            ...projectData,
            fecha_inicio: projectData.fecha_inicio ? new Date(projectData.fecha_inicio).toISOString().split('T')[0] : '',
            fecha_fin: projectData.fecha_fin ? new Date(projectData.fecha_fin).toISOString().split('T')[0] : '',
          };
          setFormData(formattedData);
        } else {
          setError("No se pudo cargar la información del proyecto.");
        }

        setManagers(profilesResponse || []);

      } catch (err) {
        console.error("Error al cargar datos para la edición:", err);
        setError("Ocurrió un error al cargar los datos.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [projectId]);
  
  const validateForm = () => { /* ... lógica de validación ... */ return true; };
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "sigla_incidencia") {
        setFormData(prev => ({ ...prev, [name]: value.toUpperCase().replace(/\s+/g, '') }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
        const response = await updateProject(projectId, formData);
        if (response && response.success) {
            alert(`Proyecto "${response.data.nombre}" actualizado exitosamente (Simulación).`);
            navigate(`/proyectos/${projectId}`);
        } else {
            throw new Error(response.error || "Error desconocido al actualizar.");
        }
    } catch(err) {
        setError('Ocurrió un error al guardar los cambios.');
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const inputFieldClass = "input-field w-full pl-10";
  const labelFieldClass = "block text-sm font-medium text-gray-700";
  const errorFieldClass = "text-red-500 text-xs mt-1";

  if (isLoading) {
    return <div className="p-6 text-center">Cargando datos del proyecto...</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Editar Proyecto</h1> 
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 shadow-lg rounded-lg">
        <div>
          <label htmlFor="nombre" className={labelFieldClass}>Nombre del Proyecto <span className="text-red-500">*</span></label>
          <div className="relative mt-1">
              <FaProjectDiagram className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input type="text" name="nombre" id="nombre" value={formData.nombre || ''} onChange={handleChange} className={inputFieldClass} />
          </div>
          {formErrors.nombre && <p className={errorFieldClass}>{formErrors.nombre}</p>}
        </div>

        <div>
          <label htmlFor="sigla_incidencia" className={labelFieldClass}>Sigla para Incidencias (máx. 6 caracteres) <span className="text-red-500">*</span></label>
           <div className="relative mt-1">
              <FaTag className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                name="sigla_incidencia" 
                id="sigla_incidencia" 
                value={formData.sigla_incidencia || ''} 
                onChange={handleChange} 
                className={inputFieldClass}
                maxLength="6" 
              />
          </div>
          {formErrors.sigla_incidencia && <p className={errorFieldClass}>{formErrors.sigla_incidencia}</p>}
        </div>

        <div>
          <label htmlFor="descripcion" className={labelFieldClass}>Descripción</label>
          <div className="relative mt-1">
            <FaFileAlt className="absolute top-3 left-3 text-gray-400" />
            <textarea name="descripcion" id="descripcion" value={formData.descripcion || ''} onChange={handleChange} rows="4" className={`${inputFieldClass} pt-2`}></textarea>
          </div>
        </div>

        <div>
          <label htmlFor="estado" className={labelFieldClass}>Estado <span className="text-red-500">*</span></label>
          <div className="relative mt-1">
            <FaCheckCircle className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <select name="estado" id="estado" value={formData.estado} onChange={handleChange} className={inputFieldClass}>
                <option value="Planeado">Planeado</option>
                <option value="Activo">Activo</option>
                <option value="En Espera">En Espera</option>
                <option value="Cerrado">Cerrado</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="manager_id" className={labelFieldClass}>Manager del Proyecto</label>
          <div className="relative mt-1">
            <FaUserTie className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <select name="manager_id" id="manager_id" value={formData.manager_id || ''} onChange={handleChange} className={inputFieldClass}>
                <option value="">-- Seleccionar Manager --</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>{manager.nombre_completo}</option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="fecha_inicio" className={labelFieldClass}>Fecha de Inicio</label>
             <div className="relative mt-1">
                <FaCalendarAlt className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                <input type="date" name="fecha_inicio" id="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} className={inputFieldClass} />
            </div>
          </div>
          <div>
            <label htmlFor="fecha_fin" className={labelFieldClass}>Fecha de Fin</label>
             <div className="relative mt-1">
                <FaCalendarAlt className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                <input type="date" name="fecha_fin" id="fecha_fin" value={formData.fecha_fin} onChange={handleChange} className={inputFieldClass} />
            </div>
            {formErrors.fecha_fin && <p className={errorFieldClass}>{formErrors.fecha_fin}</p>}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t mt-2">
          <Link 
            to={`/proyectos/${projectId}`} 
            className="btn-secondary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap hover:bg-red-600 hover:border-red-700 hover:text-white transition-colors duration-200"
          >
            <FaTimes className="mr-2" />
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting || isLoading} 
            className="btn-primary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap"
          >
            <FaSave className="mr-2" />
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectEdit;