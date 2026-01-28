// src/pages/Projects/ProjectEdit.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
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
        // 1. Carga de perfiles (Managers) y datos del proyecto en paralelo
        const [projectSnap, profilesSnap] = await Promise.all([
          getDoc(doc(db, "projects", projectId)),
          getDocs(collection(db, "profiles"))
        ]);

        if (projectSnap.exists()) {
          const projectData = projectSnap.data();
          setFormData({
            ...projectData,
            // Aseguramos que los valores sean strings para evitar errores en inputs controlados
            nombre: projectData.nombre || '',
            sigla_incidencia: projectData.sigla_incidencia || '',
            descripcion: projectData.descripcion || '',
            estado: projectData.estado || 'Planeado',
            manager_id: projectData.manager_id || '',
            fecha_inicio: projectData.fecha_inicio || '',
            fecha_fin: projectData.fecha_fin || '',
          });
        } else {
          setError("El proyecto solicitado no existe.");
        }

        const profiles = profilesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setManagers(profiles);

      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error de conexión con la base de datos.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [projectId]);
  
  const validateForm = () => {
    const errors = {};
    if (!formData.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
    if (!formData.sigla_incidencia.trim()) errors.sigla_incidencia = "La sigla es obligatoria.";
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

    setIsSubmitting(true);
    setError(null);
    
    try {
        const selectedManager = managers.find(m => m.id === formData.manager_id);
        const projectRef = doc(db, "projects", projectId);
        
        // 2. Actualización en Firestore
        await updateDoc(projectRef, {
            ...formData,
            manager_nombre: selectedManager ? selectedManager.nombre_completo : 'Sin asignar',
            actualizado_en: serverTimestamp()
        });

        navigate(`/proyectos/${projectId}`);
    } catch(err) {
        setError('No se pudieron guardar los cambios en el servidor.');
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const inputFieldClass = "input-field w-full pl-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500";
  const labelFieldClass = "block text-sm font-semibold text-gray-700";
  const errorFieldClass = "text-red-500 text-xs mt-1";

  if (isLoading) {
    return <div className="p-10 text-center font-bold text-indigo-600 animate-pulse">Cargando proyecto...</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-2 mb-6 text-gray-400">
          <Link to="/proyectos" className="hover:text-indigo-600">Proyectos</Link>
          <span>/</span>
          <span className="text-gray-900 font-bold">Editar</span>
      </div>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Editar Proyecto</h1> 
      
      {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-md">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 shadow-xl rounded-xl border border-gray-100">
        <div>
          <label htmlFor="nombre" className={labelFieldClass}>Nombre del Proyecto</label>
          <div className="relative mt-1">
              <FaProjectDiagram className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} className={inputFieldClass} />
          </div>
          {formErrors.nombre && <p className={errorFieldClass}>{formErrors.nombre}</p>}
        </div>

        <div>
          <label htmlFor="sigla_incidencia" className={labelFieldClass}>Sigla (ID de Tickets)</label>
           <div className="relative mt-1">
              <FaTag className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input type="text" name="sigla_incidencia" id="sigla_incidencia" value={formData.sigla_incidencia} onChange={handleChange} className={inputFieldClass} maxLength="6" />
          </div>
          {formErrors.sigla_incidencia && <p className={errorFieldClass}>{formErrors.sigla_incidencia}</p>}
        </div>

        <div>
          <label htmlFor="descripcion" className={labelFieldClass}>Descripción</label>
          <div className="relative mt-1">
            <FaFileAlt className="absolute top-3 left-3 text-gray-400" />
            <textarea name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleChange} rows="4" className={`${inputFieldClass} pt-2`}></textarea>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="estado" className={labelFieldClass}>Estado</label>
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
              <label htmlFor="manager_id" className={labelFieldClass}>Project Manager</label>
              <div className="relative mt-1">
                <FaUserTie className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                <select name="manager_id" id="manager_id" value={formData.manager_id} onChange={handleChange} className={inputFieldClass}>
                    <option value="">-- Seleccionar Manager --</option>
                    {managers.map(manager => (
                      <option key={manager.id} value={manager.id}>{manager.nombre_completo}</option>
                    ))}
                </select>
              </div>
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
        
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Link to={`/proyectos/${projectId}`} className="px-6 py-2 rounded-lg text-gray-600 font-bold hover:bg-gray-100 transition-colors">
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting || isLoading} 
            className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-bold shadow-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-all"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectEdit;