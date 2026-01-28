// src/pages/Projects/ProjectCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
// --- REFACTOR: Eliminados FaSave y FaTimes que no se usaban ---
import { FaProjectDiagram, FaTag, FaFileAlt, FaCalendarAlt, FaUserTie, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const ProjectCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
        const querySnapshot = await getDocs(collection(db, "profiles"));
        const profilesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setManagers(profilesData);
      } catch (err) {
        console.error("Error al cargar managers:", err);
        setError("No se pudieron cargar los perfiles de usuario.");
      }
    };
    loadManagers();
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!formData.nombre.trim()) errors.nombre = "El nombre del proyecto es obligatorio.";
    if (!formData.sigla_incidencia.trim()) {
      errors.sigla_incidencia = "La sigla para tickets es obligatoria.";
    } else if (formData.sigla_incidencia.length > 6) {
      errors.sigla_incidencia = "La sigla no debe exceder los 6 caracteres.";
    }
    if (formData.fecha_inicio && formData.fecha_fin && new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
      errors.fecha_fin = "La fecha límite no puede ser anterior al inicio.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const handlers = {
      sigla_incidencia: (val) => val.toUpperCase().replace(/\s+/g, ''),
    };
    const processedValue = handlers[name] ? handlers[name](value) : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || !user) {
        if (!user) setError("Tu sesión ha expirado. Por favor, recarga la página.");
        return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const selectedManager = managers.find(m => m.id === formData.manager_id);
      const memberUIDs = [user.uid];
      if (formData.manager_id && !memberUIDs.includes(formData.manager_id)) {
        memberUIDs.push(formData.manager_id);
      }

      await addDoc(collection(db, "projects"), {
        ...formData,
        manager_nombre: selectedManager ? selectedManager.nombre_completo : 'Sin asignar',
        creado_en: serverTimestamp(),
        actualizado_en: serverTimestamp(),
        ownerId: user.uid,
        members: memberUIDs,
      });
      
      navigate('/proyectos');
    } catch (err) {
      console.error("Error al crear proyecto en Firebase:", err);
      setError(`Error al guardar: ${err.message}. Revisa las reglas de seguridad de Firestore.`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- REFACTOR: Clases de estilo para consistencia ---
  const inputFieldClass = "input-field w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";
  const labelFieldClass = "block text-sm font-medium text-gray-800 mb-1";
  const errorFieldClass = "text-red-600 text-xs mt-1 font-semibold";

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Proyecto</h1> 
        <Link to="/proyectos" className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors">Volver a Proyectos</Link>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-r-lg">
            <p className="font-bold">Error</p>
            <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 shadow-lg rounded-xl border border-gray-200">
        {/* --- REFACTOR UX: Agrupación de campos --- */}
        <fieldset className="mb-8">
          <legend className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-indigo-200 pb-2">Detalles del Proyecto</legend>
          <div className="space-y-6">
            <div>
              <label htmlFor="nombre" className={labelFieldClass}>Nombre del Proyecto <span className="text-red-500">*</span></label>
              <div className="relative">
                  <FaProjectDiagram className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} className={inputFieldClass} placeholder="Ej: Plataforma E-commerce 2026"/>
              </div>
              {formErrors.nombre && <p className={errorFieldClass}>{formErrors.nombre}</p>}
            </div>
            <div>
              <label htmlFor="sigla_incidencia" className={labelFieldClass}>Sigla para Tickets (máx. 6) <span className="text-red-500">*</span></label>
              <div className="relative">
                  <FaTag className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="sigla_incidencia" id="sigla_incidencia" value={formData.sigla_incidencia} onChange={handleChange} className={inputFieldClass} maxLength="6" placeholder="Ej: SHOP-V2" />
              </div>
              {formErrors.sigla_incidencia && <p className={errorFieldClass}>{formErrors.sigla_incidencia}</p>}
              <p className="mt-1 text-xs text-gray-500 italic">Se usará como prefijo para los tickets. Ejemplo: {formData.sigla_incidencia || 'SIGLA'}-101</p>
            </div>
            <div>
              <label htmlFor="descripcion" className={labelFieldClass}>Descripción</label>
              <div className="relative">
                <FaFileAlt className="absolute top-4 left-3 text-gray-400" />
                <textarea name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleChange} rows="4" className={`${inputFieldClass} pt-3`} placeholder="Describe los objetivos, alcance y tecnologías principales del proyecto..."></textarea>
              </div>
            </div>
          </div>
        </fieldset>

        {/* --- REFACTOR UX: Agrupación de campos --- */}
        <fieldset className="mb-8">
            <legend className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-indigo-200 pb-2">Planificación y Responsables</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <label htmlFor="estado" className={labelFieldClass}>Estado Inicial</label>
                  <div className="relative">
                    <FaCheckCircle className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                    <select name="estado" id="estado" value={formData.estado} onChange={handleChange} className={inputFieldClass}>
                        <option value="Planeado">Planeado 📅</option>
                        <option value="Activo">Activo 🚀</option>
                        <option value="En Espera">En Espera ✋</option>
                        <option value="Cerrado">Cerrado ✅</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="manager_id" className={labelFieldClass}>Project Manager Asignado</label>
                  <div className="relative">
                    <FaUserTie className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                    <select name="manager_id" id="manager_id" value={formData.manager_id} onChange={handleChange} className={inputFieldClass}>
                        <option value="">-- Sin asignar --</option>
                        {managers.map(manager => (
                          <option key={manager.id} value={manager.id}>{manager.nombre_completo}</option>
                        ))}
                    </select>
                  </div>
                </div>
                <div>
                    <label htmlFor="fecha_inicio" className={labelFieldClass}>Fecha de Lanzamiento</label>
                    <div className="relative">
                        <FaCalendarAlt className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <input type="date" name="fecha_inicio" id="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} className={inputFieldClass} />
                    </div>
                </div>
                <div>
                    <label htmlFor="fecha_fin" className={labelFieldClass}>Fecha Límite (Deadline)</label>
                    <div className="relative">
                        <FaCalendarAlt className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <input type="date" name="fecha_fin" id="fecha_fin" value={formData.fecha_fin} onChange={handleChange} className={inputFieldClass} />
                    </div>
                    {formErrors.fecha_fin && <p className={errorFieldClass}>{formErrors.fecha_fin}</p>}
                </div>
            </div>
        </fieldset>

        <div className="flex justify-end items-center space-x-4 pt-5 border-t border-gray-200 mt-4">
          <Link to="/proyectos" className="px-6 py-2.5 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 active:bg-gray-200 transition-all">
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-48 h-11 flex items-center justify-center bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 active:scale-95 disabled:bg-indigo-400 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            {/* --- REFACTOR UI: Feedback de carga mejorado --- */}
            {isLoading ? <FaSpinner className="animate-spin h-5 w-5" /> : 'Crear Proyecto'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectCreate;
