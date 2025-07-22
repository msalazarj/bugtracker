// src/pages/Projects/ProjectCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Se importa Link
import { getProfiles as fetchMockProfiles } from '../../services/profile';
// COMENTARIO: Se añade FaCheckCircle para el campo de estado.
import { FaSave, FaTimes, FaProjectDiagram, FaTag, FaFileAlt, FaCalendarAlt, FaUserTie, FaCheckCircle } from 'react-icons/fa';

const ProjectCreate = () => {
  const navigate = useNavigate();
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const loadManagers = async () => {
      try {
        const profilesData = await fetchMockProfiles();
        setManagers(profilesData || []);
      } catch (err) {
        console.error("Error al cargar managers para el selector:", err);
      }
    };
    loadManagers();
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!formData.nombre.trim()) errors.nombre = "El nombre del proyecto es obligatorio.";
    if (!formData.sigla_incidencia.trim()) {
      errors.sigla_incidencia = "La sigla para incidencias es obligatoria.";
    } else if (formData.sigla_incidencia.length > 6) {
      errors.sigla_incidencia = "La sigla no puede tener más de 6 caracteres.";
    }
    if (!formData.estado) errors.estado = "El estado es obligatorio.";
    if (formData.fecha_inicio && formData.fecha_fin && new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
      errors.fecha_fin = "La fecha de fin no puede ser anterior a la fecha de inicio.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

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

    setIsLoading(true);
    setError(null);
    console.log("MOCK: Creando proyecto con datos:", formData);
    
    setTimeout(() => {
      setIsLoading(false);
      alert(`Proyecto "${formData.nombre}" con sigla "${formData.sigla_incidencia}" creado exitosamente (Simulación)!`); 
      navigate('/proyectos');
    }, 700);
  };

  const inputFieldClass = "input-field w-full pl-10";
  const labelFieldClass = "block text-sm font-medium text-gray-700";
  const errorFieldClass = "text-red-500 text-xs mt-1";

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Crear Nuevo Proyecto</h1> 
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 shadow-lg rounded-lg">
        <div>
          <label htmlFor="nombre" className={labelFieldClass}>Nombre del Proyecto <span className="text-red-500">*</span></label>
          <div className="relative mt-1">
              <FaProjectDiagram className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} className={inputFieldClass} placeholder="Ej: Plataforma PrimeTrack v2"/>
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
                value={formData.sigla_incidencia} 
                onChange={handleChange} 
                className={inputFieldClass}
                maxLength="6" 
                placeholder="Ej: PRIMET" 
              />
          </div>
          {formErrors.sigla_incidencia && <p className={errorFieldClass}>{formErrors.sigla_incidencia}</p>}
          <p className="mt-1 text-xs text-gray-500">Esta sigla se usará para identificar las incidencias de este proyecto.</p>
        </div>

        <div>
          <label htmlFor="descripcion" className={labelFieldClass}>Descripción</label>
          <div className="relative mt-1">
            <FaFileAlt className="absolute top-3 left-3 text-gray-400" />
            <textarea name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleChange} rows="4" className={`${inputFieldClass} pt-2`}></textarea>
          </div>
        </div>

        <div>
          <label htmlFor="estado" className={labelFieldClass}>Estado <span className="text-red-500">*</span></label>
          {/* COMENTARIO: Se añade ícono al campo de Estado */}
          <div className="relative mt-1">
            <FaCheckCircle className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <select name="estado" id="estado" value={formData.estado} onChange={handleChange} className={inputFieldClass}>
                <option value="Planeado">Planeado</option>
                <option value="Activo">Activo</option>
                <option value="En Espera">En Espera</option>
                <option value="Cerrado">Cerrado</option>
            </select>
          </div>
          {formErrors.estado && <p className={errorFieldClass}>{formErrors.estado}</p>}
        </div>

        <div>
          <label htmlFor="manager_id" className={labelFieldClass}>Manager del Proyecto</label>
          <div className="relative mt-1">
            <FaUserTie className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            {/* COMENTARIO: Se eliminó 'appearance-none' para consistencia con otros selects */}
            <select name="manager_id" id="manager_id" value={formData.manager_id} onChange={handleChange} className={inputFieldClass}>
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
          {/* COMENTARIO: Se usa Link para "Cancelar" y se estandarizan los botones */}
          <Link 
            to="/proyectos"
            className="btn-secondary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap hover:bg-red-600 hover:border-red-700 hover:text-white transition-colors duration-200"
          >
            <FaTimes className="mr-2" />
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={isLoading} 
            className="btn-primary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap"
          >
            <FaSave className="mr-2" />
            {isLoading ? 'Creando...' : 'Crear Proyecto'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectCreate;