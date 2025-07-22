// src/pages/Bugs/BugCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// COMENTARIO: Se importan todos los íconos necesarios
import { FaPaperclip, FaBug, FaStar, FaWrench, FaTasks, FaInfoCircle, FaExclamationCircle, FaAngleDoubleUp, FaEquals, FaAngleDoubleDown, FaProjectDiagram, FaHeading, FaUserCheck, FaSave, FaTimes } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// --- Mock Data ---
const mockUsuarios = [ { id: 'user_uuid_01', nombre_completo: 'Ana Desarrolladora' }, { id: 'user_uuid_02', nombre_completo: 'Juan Probador' }, { id: 'user_uuid_03', nombre_completo: 'Carlos Creador' } ];
const mockProyectos = [ { id: 'proyecto_mock_001', nombre: 'Desarrollo App PrimeTrack (Ejemplo)', sigla_incidencia: 'PRTRCK', miembros: [mockUsuarios[0], mockUsuarios[1], mockUsuarios[2]] }, { id: 'proyecto_mock_002', nombre: 'Migración Servidores Cloud (Ejemplo)', sigla_incidencia: 'MCLOUD', miembros: [mockUsuarios[0], mockUsuarios[2]] }];
const mockBugsDataInicial = [{ id: 'PRTRCK-001', titulo: 'Error de autenticación con caracteres especiales', prioridad: 'Alta', estado: 'Abierto', tipo: 'Error', proyecto_id: mockProyectos[0].id, asignado_a_id: mockUsuarios[0].id, descripcion: 'Al intentar ingresar con un usuario y contraseña incorrectos, el sistema no muestra un mensaje de error claro, solo recarga la página.' }];
const opcionesPrioridad = [ { valor: 'Baja', icono: <FaAngleDoubleDown /> }, { valor: 'Normal', icono: <FaEquals /> }, { valor: 'Alta', icono: <FaAngleDoubleUp /> }, { valor: 'Crítica', icono: <FaExclamationCircle /> }];
const opcionesTipo = [ { valor: 'Bug', icono: <FaBug /> }, { valor: 'Nueva Característica', icono: <FaStar /> }, { valor: 'Mejora', icono: <FaWrench /> }, { valor: 'Tarea', icono: <FaTasks /> }, { valor: 'General', icono: <FaInfoCircle /> }];
const quillModules = { toolbar: [ [{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike', 'blockquote'], [{'list': 'ordered'}, {'list': 'bullet'}], ['link', 'image'], ['clean'] ]};

const BugCreate = () => {
  const navigate = useNavigate();
  const { projectId, bugId } = useParams();
  const isEditMode = Boolean(bugId);

  const [formData, setFormData] = useState({ proyecto_id: '', titulo: '', asignado_a_id: '', prioridad: 'Normal', tipo: 'Bug' });
  const [descripcion, setDescripcion] = useState('');
  const [projects, setProjects] = useState([]);
  const [availableAssignees, setAvailableAssignees] = useState([]);
  const [isProjectLocked, setIsProjectLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    setProjects(mockProyectos);
    if (isEditMode) {
      console.log("MOCK: Cargando datos del bug para editar, ID:", bugId);
      const bugToEdit = mockBugsDataInicial.find(b => b.id === bugId);
      if (bugToEdit) {
        setFormData({
          proyecto_id: bugToEdit.proyecto_id,
          titulo: bugToEdit.titulo,
          asignado_a_id: bugToEdit.asignado_a_id || '',
          prioridad: bugToEdit.prioridad,
          tipo: bugToEdit.tipo,
        });
        setDescripcion(bugToEdit.descripcion);
        setIsProjectLocked(true);
      } else {
        alert("Bug no encontrado (Mock)!");
        navigate(projectId ? `/proyectos/${projectId}/issues` : '/proyectos');
      }
    } else if (projectId) {
      setFormData(prevData => ({ ...prevData, proyecto_id: projectId }));
      setIsProjectLocked(true);
    }
  }, [projectId, bugId, isEditMode, navigate]);

  useEffect(() => {
    if (formData.proyecto_id) {
      const selectedProject = mockProyectos.find(p => p.id === formData.proyecto_id);
      setAvailableAssignees(selectedProject ? selectedProject.miembros : []);
      if (!isEditMode && selectedProject && !selectedProject.miembros.some(m => m.id === formData.asignado_a_id)) {
        setFormData(prevData => ({...prevData, asignado_a_id: ''}));
      }
    } else {
      setAvailableAssignees([]);
      setFormData(prevData => ({...prevData, asignado_a_id: ''}));
    }
  }, [formData.proyecto_id, isEditMode]);

  const handleSubmit = (e) => { e.preventDefault(); /* ... */ };
  const handleInputChange = (e) => { setFormData(prevData => ({ ...prevData, [e.target.name]: e.target.value })); };
  const handleFieldSelect = (name, value) => { setFormData(prevData => ({ ...prevData, [name]: value })); };

  const inputFieldClass = "input-field w-full pl-10";
  const labelFieldClass = "block text-sm font-medium text-gray-700";
  const errorFieldClass = "text-red-500 text-xs mt-1";
  const selectionButtonClass = "px-4 py-2 text-sm border rounded-md transition-colors duration-150 flex items-center space-x-2";
  const activeSelectionButtonClass = "bg-indigo-600 text-white border-indigo-600";
  const inactiveSelectionButtonClass = "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        {isEditMode ? `Editando Bug: ${bugId}` : 'Crear Nuevo Bug'}
      </h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 shadow-lg rounded-lg space-y-6">
        {/* COMENTARIO: Se aplican estilos con íconos a todos los campos */}
        <div>
          <label htmlFor="proyecto_id" className={labelFieldClass}>Proyecto <span className="text-red-500">*</span></label>
          <div className="relative mt-1">
            <FaProjectDiagram className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <select id="proyecto_id" name="proyecto_id" value={formData.proyecto_id} onChange={handleInputChange} className={inputFieldClass} disabled={isProjectLocked}>
              <option value="">-- Selecciona un proyecto --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          {formErrors.proyecto_id && <p className={errorFieldClass}>{formErrors.proyecto_id}</p>}
        </div>
        <div>
          <label htmlFor="titulo" className={labelFieldClass}>Título <span className="text-red-500">*</span></label>
          <div className="relative mt-1">
            <FaHeading className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <input type="text" id="titulo" name="titulo" value={formData.titulo} onChange={handleInputChange} className={inputFieldClass} />
          </div>
          {formErrors.titulo && <p className={errorFieldClass}>{formErrors.titulo}</p>}
          <p className="mt-1 text-xs text-gray-500">Por favor, incluye el módulo o funcionalidad que estás revisando. Ej: 'Login - El botón de acceso no responde'</p>
        </div>
        <div>
          <label htmlFor="asignado_a_id" className={labelFieldClass}>Asignar a</label>
          <div className="relative mt-1">
            <FaUserCheck className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <select id="asignado_a_id" name="asignado_a_id" value={formData.asignado_a_id} onChange={handleInputChange} className={inputFieldClass} disabled={!formData.proyecto_id}>
              <option value="">-- Sin Asignar --</option>
              {availableAssignees.map(miembro => ( <option key={miembro.id} value={miembro.id}>{miembro.nombre_completo}</option> ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelFieldClass}>Prioridad</label>
          <div className="flex flex-wrap gap-2 mt-1">{opcionesPrioridad.map(p => (<button type="button" key={p.valor} onClick={() => handleFieldSelect('prioridad', p.valor)} className={`${selectionButtonClass} ${formData.prioridad === p.valor ? activeSelectionButtonClass : inactiveSelectionButtonClass}`}>{p.icono} <span>{p.valor}</span></button>))}</div>
        </div>
        <div>
          <label className={labelFieldClass}>Tipo</label>
          <div className="flex flex-wrap gap-2 mt-1">{opcionesTipo.map(t => (<button type="button" key={t.valor} onClick={() => handleFieldSelect('tipo', t.valor)} className={`${selectionButtonClass} ${formData.tipo === t.valor ? activeSelectionButtonClass : inactiveSelectionButtonClass}`}>{t.icono} <span>{t.valor}</span></button>))}</div>
        </div>
        <div className="pt-6">
          <label htmlFor="descripcion" className={labelFieldClass}>Detalles <span className="text-red-500">*</span></label>
          <div className="mt-1 quill-editor-container h-64"><ReactQuill theme="snow" value={descripcion} onChange={setDescripcion} modules={quillModules} className="h-full" placeholder="Describe el bug con el mayor detalle posible..."/></div>
          {formErrors.descripcion && <p className={errorFieldClass}>{formErrors.descripcion}</p>}
        </div>
        <div className="pt-6">
          <label className={labelFieldClass}>Archivos Adjuntos</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"><div className="space-y-1 text-center"><FaPaperclip className="mx-auto h-12 w-12 text-gray-400" /><p className="text-sm text-gray-600"><button type="button" onClick={() => alert("Funcionalidad no implementada en el mock.")} className="font-medium text-indigo-600 hover:text-indigo-500">Sube un archivo</button>{' '}o arrastra y suelta aquí</p><p className="text-xs text-gray-500">PNG, JPG, GIF, PDF hasta 10MB</p></div></div>
        </div>
        {/* COMENTARIO: Se aplican los estilos estándar a los botones. */}
        <div className="flex justify-end items-center space-x-3 pt-4 border-t mt-4">
          <button type="button" onClick={() => navigate(isEditMode ? `/proyectos/${projectId}/issues/${bugId}` : `/proyectos/${projectId}/issues`)} className="btn-secondary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap hover:bg-red-600 hover:border-red-700 hover:text-white transition-colors duration-200">
            <FaTimes className="mr-2" />
            Cancelar
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap">
            <FaSave className="mr-2" />
            {isLoading ? (isEditMode ? 'Guardando...' : 'Creando...') : (isEditMode ? 'Guardar Cambios' : 'Crear Bug')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BugCreate;