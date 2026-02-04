// src/pages/Projects/ProjectEdit.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext'; // Importar useAuth
import { 
    FaSave, FaProjectDiagram, FaTag, FaFileAlt, 
    FaRegClock, FaRegPauseCircle, FaRegPlayCircle, FaBan 
} from 'react-icons/fa';

export const projectStatusConfig = {
    Planeado: { icon: FaRegClock, color: 'text-blue-500', bg: 'bg-blue-50' },
    Activo: { icon: FaRegPlayCircle, color: 'text-green-500', bg: 'bg-green-50' },
    'En Espera': { icon: FaRegPauseCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
    Cerrado: { icon: FaBan, color: 'text-red-500', bg: 'bg-red-50' },
};

const StatusCard = ({ status, selectedStatus, onChange }) => {
    const { icon: Icon, color } = projectStatusConfig[status];
    const isSelected = status === selectedStatus;

    return (
        <div 
            className={`cursor-pointer rounded-xl p-3 flex flex-col items-center justify-center text-center border-2 transition-all duration-200 ${isSelected ? `border-indigo-600 bg-indigo-50` : `border-slate-200 bg-white hover:border-slate-300`}`}
            onClick={() => onChange(status)}
        >
            <Icon className={`w-6 h-6 mb-1.5 ${isSelected ? 'text-indigo-600' : color}`} />
            <span className={`font-bold text-xs ${isSelected ? 'text-indigo-800' : 'text-slate-600'}`}>{status}</span>
        </div>
    );
};

const ProjectEdit = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { profile } = useAuth(); // Obtener perfil del usuario
  
  const [formData, setFormData] = useState({
    nombre: '',
    sigla_incidencia: '',
    descripcion: '',
    estado: 'Planeado',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const loadProject = async () => {
      setIsLoading(true);
      try {
        const projectSnap = await getDoc(doc(db, "projects", projectId));
        if (projectSnap.exists()) {
          const projectData = projectSnap.data();

          // Verificación de seguridad en UI: el teamId del proyecto debe coincidir con el del perfil del usuario
          if (profile && projectData.teamId !== profile.teamId) {
              setError("No tienes permiso para editar este proyecto.");
              return;
          }

          setFormData({
            nombre: projectData.nombre || '',
            sigla_incidencia: projectData.sigla_incidencia || '',
            descripcion: projectData.descripcion || '',
            estado: projectData.estado || 'Planeado',
          });
        } else {
          setError("El proyecto solicitado no existe.");
        }
      } catch (err) {
        console.error("Error al cargar proyecto:", err);
        setError("Error de conexión con la base de datos.");
      } finally {
        setIsLoading(false);
      }
    };
    if (profile) { // Solo cargar si el perfil del usuario está disponible
        loadProject();
    }
  }, [projectId, profile]);
  
  const validateForm = () => {
    const errors = {};
    if (!formData.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
    if (!formData.sigla_incidencia.trim()) errors.sigla_incidencia = "La sigla es obligatoria.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStatusChange = (status) => {
      setFormData(prev => ({ ...prev, estado: status }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!profile?.teamId) {
        setError("Error crítico: No se puede identificar tu equipo.");
        return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
        const projectRef = doc(db, "projects", projectId);
        // Inyectar el teamId para asegurar su preservación durante la actualización
        const dataToUpdate = {
            ...formData,
            teamId: profile.teamId, 
            actualizado_en: serverTimestamp()
        };
        await updateDoc(projectRef, dataToUpdate);
        navigate(`/proyectos`);
    } catch(err) {
        setError('No se pudieron guardar los cambios.');
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center font-bold">Cargando...</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Editar Proyecto</h1>
          <p className="text-slate-500 mt-1">Ajusta los detalles y el estado de tu proyecto.</p>
      </div>
      
      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}
      
      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="space-y-10">

            <div className="form-field">
                <label htmlFor="nombre" className="form-label">
                    <FaProjectDiagram className="form-label-icon" /> Nombre del Proyecto
                </label>
                <input id="nombre" name="nombre" type="text" value={formData.nombre} onChange={handleChange} className="input-underlined" placeholder="Ej: Nuevo Sitio Web Corporativo" required />
                {formErrors.nombre && <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>}
            </div>

            <div className="form-field">
                <label htmlFor="sigla_incidencia" className="form-label">
                    <FaTag className="form-label-icon" /> Sigla de Incidencia
                </label>
                <input id="sigla_incidencia" name="sigla_incidencia" type="text" value={formData.sigla_incidencia} onChange={handleChange} className="input-underlined" placeholder="Ej: SITWEB" maxLength="6" required />
                {formErrors.sigla_incidencia && <p className="text-red-500 text-xs mt-1">{formErrors.sigla_incidencia}</p>}
            </div>
            
            <div className="form-field">
                <label className="form-label">Estado del Proyecto</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {Object.keys(projectStatusConfig).map(status => (
                        <StatusCard key={status} status={status} selectedStatus={formData.estado} onChange={handleStatusChange} />
                    ))}
                </div>
            </div>

            <div className="form-field">
                <label htmlFor="descripcion" className="form-label">
                    <FaFileAlt className="form-label-icon" /> Descripción (Opcional)
                </label>
                <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} className="input-underlined" placeholder="Describe el objetivo principal del proyecto..." rows="4" />
            </div>
        </div>
        
        <div className="flex items-center justify-end gap-4 mt-10 pt-6 border-t border-slate-100">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting || !profile?.teamId} className="btn-primary">
            <FaSave /> {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectEdit;
