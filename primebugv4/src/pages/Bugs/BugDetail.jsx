// src/pages/Bugs/BugDetail.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    FaEdit, FaTrash, FaPaperclip, FaCommentDots, FaSave, FaTimes, FaUserEdit, FaPlus, FaDownload,
    FaBug, FaAngleDown, FaCheckCircle, FaProjectDiagram, FaTags, FaUser, FaUserCheck, FaCalendarPlus,
    FaHistory, FaLongArrowAltRight, FaExclamationTriangle
} from 'react-icons/fa';

import { getStatusBadgeClass, getPriorityBadgeClass, getResolutionBadgeClass } from '../../utils/styleHelpers';
import { useAuth } from '../../contexts/AuthContext';


// --- Mock Data ---
const mockBugDetailData = {
  id: 'PRTRCK-001',
  titulo: 'Error de autenticación con caracteres especiales en contraseña',
  descripcion: 'Al intentar ingresar con un usuario y contraseña incorrectos, el sistema no muestra un mensaje de error claro, solo recarga la página.\n\nSe ha detectado que ocurre cuando la contraseña incluye los símbolos #, $, % y posiblemente otros.\n\nPasos para reproducir:\n1. Ir a la página de Login.\n2. Ingresar un email válido.\n3. Ingresar una contraseña que contenga `#`.\n4. Hacer clic en "Ingresar".\n\nResultado esperado: Mensaje de error claro.\nResultado actual: La página se recarga sin feedback.',
  prioridad: 'Alta', 
  estado: 'Resuelto',
  resolucion: 'Completada',
  tipo: 'Bug',
  proyecto: { id: 'proyecto_mock_001', nombre: 'Desarrollo App PrimeTrack (Ejemplo)' },
  informador: { id: 'user_uuid_03', nombre_completo: 'Carlos Creador' },
  asignado_a: { id: 'user_uuid_01', nombre_completo: 'Ana Desarrolladora' },
  fecha_creacion: new Date('2025-05-01T10:00:00Z').toISOString(),
  fecha_actualizacion: new Date('2025-06-05T15:30:00Z').toISOString(),
  comentarios: [
    { id: 'comentario_mock_01', contenido: 'He podido replicar el error consistentemente. Parece ser un problema de sanitización en el backend.', autor: { id: 'user_uuid_03', nombre_completo: 'Carlos Creador' }, fecha_creacion: new Date('2025-05-02T14:00:00Z').toISOString() },
    { id: 'comentario_mock_02', contenido: 'Estoy empezando a trabajar en una solución.', autor: { id: 'user_uuid_01', nombre_completo: 'Ana Desarrolladora' }, fecha_creacion: new Date('2025-05-03T09:15:00Z').toISOString() }
  ],
  adjuntos: [
    { id: 'adjunto_mock_01', nombre_archivo: 'captura_error_login.png', url_archivo: '#', subido_por: { id: 'user_uuid_03', nombre_completo: 'Carlos Creador' }, fecha_subida: new Date('2025-05-01T10:05:00Z').toISOString(), tamaño_kb: 120 }
  ],
  historial: [
    { id: 'hist_3', fecha: new Date('2025-05-03T15:30:00Z').toISOString(), usuario: { nombre_completo: 'Ana Desarrolladora' }, tipo: 'estado', detalle: { anterior: 'En Progreso', nuevo: 'Resuelto' } },
    { id: 'hist_2', fecha: new Date('2025-05-02T11:00:00Z').toISOString(), usuario: { nombre_completo: 'Ana Desarrolladora' }, tipo: 'estado', detalle: { anterior: 'Abierto', nuevo: 'En Progreso' } },
    { id: 'hist_1', fecha: new Date('2025-05-01T10:05:00Z').toISOString(), usuario: { nombre_completo: 'Carlos Creador' }, tipo: 'asignacion', detalle: { anterior: 'Sin asignar', nuevo: 'Ana Desarrolladora' } },
    { id: 'hist_0', fecha: new Date('2025-05-01T10:00:00Z').toISOString(), usuario: { nombre_completo: 'Carlos Creador' }, tipo: 'creacion', detalle: 'creó el bug.' }
  ]
};
const mockAssignableUsers = [{ id: 'user_uuid_01', nombre_completo: 'Ana Desarrolladora' }, { id: 'user_uuid_02', nombre_completo: 'Juan Probador' }, { id: 'user_uuid_unassigned', nombre_completo: 'Sin Asignar' }];
const opcionesResolucion = ['Completada', 'No Aplica', 'Duplicada', 'Información Insuficiente', 'No se puede reproducir'];

const BugDetail = () => {
  const { projectId, bugId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, profile: currentProfile } = useAuth();
  
  const [bug, setBug] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isResolveDropdownOpen, setIsResolveDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef(null);
  const resolveDropdownRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => { 
        setBug({ ...mockBugDetailData, id: bugId, proyecto: {...mockBugDetailData.proyecto, id: projectId} }); 
        setIsLoading(false); 
    }, 300);
    return () => clearTimeout(timer);
  }, [projectId, bugId]);

  useEffect(() => { const handleClickOutside = (event) => { if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) { setIsAssigneeDropdownOpen(false); } if (resolveDropdownRef.current && !resolveDropdownRef.current.contains(event.target)) { setIsResolveDropdownOpen(false); } }; document.addEventListener("mousedown", handleClickOutside); return () => { document.removeEventListener("mousedown", handleClickOutside); }; }, []);
  const handleCommentSubmit = (e) => { e.preventDefault(); if (!newComment.trim() || !currentUser) return; setIsSubmittingComment(true); setTimeout(() => { const commentToAdd = { id: `comentario_mock_${Date.now()}`, contenido: newComment, autor: { id: currentUser.id, nombre_completo: currentProfile?.nombre_completo || currentUser.email }, fecha_creacion: new Date().toISOString() }; setBug(prevBug => ({ ...prevBug, comentarios: [...prevBug.comentarios, commentToAdd] })); setNewComment(''); setIsSubmittingComment(false); alert('Comentario añadido (Mock)!'); }, 500); };
  const handleStatusChange = (newStatus) => { setBug(prevBug => ({ ...prevBug, estado: newStatus, resolucion: null, fecha_actualizacion: new Date().toISOString() })); alert(`Estado del Bug cambiado a ${newStatus} (Mock)!`); };
  const handleAssignUser = (userToAssign) => { const newAssignee = userToAssign.id !== 'user_uuid_unassigned' ? { id: userToAssign.id, nombre_completo: userToAssign.nombre_completo } : null; setBug(prevBug => ({ ...prevBug, asignado_a: newAssignee, fecha_actualizacion: new Date().toISOString() })); setIsAssigneeDropdownOpen(false); alert(`Bug asignado a ${newAssignee?.nombre_completo || 'Sin Asignar'} (Mock)!`); };
  const handleResolve = (resolutionType) => { setBug(prevBug => ({ ...prevBug, estado: 'Resuelto', resolucion: resolutionType, fecha_actualizacion: new Date().toISOString() })); setIsResolveDropdownOpen(false); alert(`Bug marcado como Resuelto (${resolutionType}) (Mock)!`); };

  const dateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };

  if (isLoading) return <div className="p-6 text-center">Cargando detalle del Bug...</div>;
  if (!bug) return <div className="p-6 text-center text-red-500">Bug no encontrado.</div>;
  
  const cardClass = "bg-white shadow-lg rounded-lg p-6";
  const sectionTitleClass = "text-xl font-semibold text-gray-700 mb-4 pb-2 border-b";
  const workflowButtonClass = "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm h-9 px-3 rounded-md flex items-center justify-center whitespace-nowrap transition-colors";

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-normal text-gray-800 flex items-center"><FaBug className="mr-3 text-gray-500"/><strong className="font-semibold">{bug.id}</strong><span className="mx-2 text-gray-400">-</span><span>{bug.titulo}</span></h1>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {bug.estado === 'Resuelto' && bug.resolucion ? (
              <>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getStatusBadgeClass(bug.estado)}`}>{bug.estado}</span>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getResolutionBadgeClass(bug.resolucion)}`}>{bug.resolucion}</span>
              </>
            ) : (
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getStatusBadgeClass(bug.estado)}`}>{bug.estado}</span>
            )}
          </div>
        </div>
        <div className="border-t mt-4 pt-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => handleStatusChange('En Progreso')} className={workflowButtonClass}>Iniciar Progreso</button>
            <div className="relative" ref={resolveDropdownRef}><button onClick={() => setIsResolveDropdownOpen(prev => !prev)} className={workflowButtonClass}><span>Resolver</span> <FaAngleDown className="ml-2 h-3 w-3"/></button>{isResolveDropdownOpen && (<div className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"><div className="py-1">{opcionesResolucion.map(res => (<a key={res} href="#" onClick={(e) => { e.preventDefault(); handleResolve(res); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{res}</a>))}</div></div>)}</div>
            <button onClick={() => handleStatusChange('Reabierto')} className={workflowButtonClass}>Reabrir</button>
            <button onClick={() => handleStatusChange('Cerrado')} className={workflowButtonClass}>Cerrar</button>
            <div className="relative" ref={assigneeDropdownRef}><button onClick={() => setIsAssigneeDropdownOpen(prev => !prev)} className={workflowButtonClass}><span>Asignar</span> <FaAngleDown className="ml-2 h-3 w-3"/></button>{isAssigneeDropdownOpen && (<div className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"><div className="py-1">{mockAssignableUsers.map(user => (<a key={user.id} href="#" onClick={(e) => { e.preventDefault(); handleAssignUser(user); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{user.nombre_completo}</a>))}</div></div>)}</div>
          </div>
          
          {/* --- COMENTARIO: Se aplican clases de Tailwind directamente para asegurar el estilo y la alineación --- */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button className="inline-flex items-center justify-center whitespace-nowrap h-10 px-4 text-sm font-semibold border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-colors duration-200">
                <FaEdit className="mr-2"/> <span>Editar</span>
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap h-10 px-4 text-sm font-semibold border border-red-600 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-colors duration-200">
                <FaTrash className="mr-2"/> <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={cardClass}><h2 className={sectionTitleClass}>Descripción</h2><div className="prose max-w-none text-gray-700 whitespace-pre-wrap">{bug.descripcion || <span className="italic">No hay descripción detallada.</span>}</div></div>
          <div className={cardClass}><div className="flex justify-between items-center mb-3"><h2 className="text-xl font-semibold text-gray-700">Archivos Adjuntos ({bug.adjuntos.length})</h2><button onClick={() => alert("Funcionalidad Subir Archivo (Mock)")} className="btn-secondary text-sm h-9 px-3 inline-flex items-center"><FaPlus/> <span>Adjuntar Archivo</span></button></div>{bug.adjuntos.length > 0 ? ( <ul className="space-y-2">{bug.adjuntos.map(adjunto => ( <li key={adjunto.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 text-sm"><div className="flex items-center space-x-2 overflow-hidden"><FaPaperclip className="text-gray-500 flex-shrink-0" /><a href={adjunto.url_archivo} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate">{adjunto.nombre_archivo}</a><span className="text-xs text-gray-400 flex-shrink-0">({adjunto.tamaño_kb} KB)</span></div><div className="text-xs text-gray-500 flex-shrink-0 ml-2">Subido por: {adjunto.subido_por.nombre_completo}</div><div className="space-x-1 flex-shrink-0"><button title="Descargar" className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition-colors"><FaDownload/></button><button title="Eliminar" className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100 transition-colors"><FaTrash/></button></div></li>))}</ul>) : (<p className="text-sm text-gray-500 italic">No hay archivos adjuntos.</p>)}</div>
          
          <div className={cardClass}><h2 className={sectionTitleClass}>Comentarios ({bug.comentarios.length})</h2><div className="space-y-6 mb-6">{bug.comentarios.length > 0 ? bug.comentarios.map(comentario => { const isCurrentUser = comentario.autor.id === currentUser?.id; return (<div key={comentario.id} className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}><img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comentario.autor.nombre_completo)}&background=random&color=fff`} alt={comentario.autor.nombre_completo} className="w-8 h-8 rounded-full flex-shrink-0" /><div className={`max-w-xl p-3 rounded-lg ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}><div className="flex items-center justify-between mb-1"><p className={`font-semibold text-sm ${isCurrentUser ? 'text-blue-100' : 'text-gray-900'}`}>{comentario.autor.nombre_completo}</p><p className={`text-xs ml-4 ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>{new Date(comentario.fecha_creacion).toLocaleString('es-CL', dateTimeFormatOptions)}</p></div><p className="text-sm whitespace-pre-wrap">{comentario.contenido}</p></div></div>)}) : <p className="text-sm text-gray-500 italic">No hay comentarios aún.</p>}</div><form onSubmit={handleCommentSubmit} className="flex items-start space-x-3 border-t pt-4"><textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escribe un comentario..." className="input-field w-full min-h-[60px]" rows="2" disabled={isSubmittingComment}></textarea><button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={isSubmittingComment}>{isSubmittingComment ? 'Enviando...' : 'Añadir'}</button></form></div>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <div className={cardClass}><h3 className={sectionTitleClass}>Atributos</h3><ul className="space-y-4">
            <li className="flex items-center text-sm"><FaProjectDiagram className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" /><div className="w-28 font-medium text-gray-500 flex-shrink-0">Proyecto:</div><Link to={`/proyectos/${bug.proyecto.id}`} className="text-indigo-600 hover:underline truncate">{bug.proyecto.nombre}</Link></li>
            <li className="flex items-center text-sm"><FaTags className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" /><div className="w-28 font-medium text-gray-500 flex-shrink-0">Tipo:</div><div className="text-gray-800">{bug.tipo}</div></li>
            <li className="flex items-center text-sm"><FaExclamationTriangle className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" /><div className="w-28 font-medium text-gray-500 flex-shrink-0">Prioridad:</div><span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${getPriorityBadgeClass(bug.prioridad)}`}>{bug.prioridad}</span></li>
            <li className="flex items-center text-sm"><FaUser className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" /><div className="w-28 font-medium text-gray-500 flex-shrink-0">Informador:</div><div className="text-gray-800">{bug.informador.nombre_completo}</div></li>
            <li className="flex items-center text-sm"><FaUserCheck className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" /><div className="w-28 font-medium text-gray-500 flex-shrink-0">Asignado a:</div><div className="text-gray-800">{bug.asignado_a?.nombre_completo || <span className="italic">Sin asignar</span>}</div></li>
            <li className="flex items-center text-sm"><FaCalendarPlus className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" /><div className="w-28 font-medium text-gray-500 flex-shrink-0">Creación:</div><div className="text-gray-800">{new Date(bug.fecha_creacion).toLocaleString('es-CL', dateTimeFormatOptions)}</div></li>
            <li className="flex items-center text-sm"><FaHistory className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" /><div className="w-28 font-medium text-gray-500 flex-shrink-0">Actualización:</div><div className="text-gray-800">{new Date(bug.fecha_actualizacion).toLocaleString('es-CL', dateTimeFormatOptions)}</div></li>
          </ul></div>
          <div className={cardClass}><h3 className={sectionTitleClass}>Historial</h3><ul className="space-y-4">{bug.historial && bug.historial.map(entry => (<li key={entry.id} className="border-l-2 pl-4 border-gray-200"><div className="flex justify-between items-center"><span className="font-semibold text-sm text-gray-800 flex items-center"><FaUser className="mr-2 text-gray-400"/> {entry.usuario.nombre_completo}</span><span className="text-xs text-gray-500">{new Date(entry.fecha).toLocaleString('es-CL', dateTimeFormatOptions)}</span></div>
            <div className="text-sm mt-1 text-gray-600">
                {entry.tipo === 'creacion' && (<p>{entry.detalle}</p>)}
                {entry.tipo === 'asignacion' && (<p className="flex items-center"><span className="italic mr-2">Asignado:</span><span className="font-semibold text-gray-700">{entry.detalle.nuevo}</span></p>)}
                {entry.tipo === 'estado' && (
                    <p className="flex items-center flex-wrap">
                        <span className="italic mr-2">Estado:</span>
                        <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded-md text-xs font-medium">{entry.detalle.anterior}</span>
                        <FaLongArrowAltRight className="mx-2 text-gray-400"/>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${getStatusBadgeClass(entry.detalle.nuevo)}`}>{entry.detalle.nuevo}</span>
                    </p>
                )}
            </div>
          </li>))}</ul></div>
        </div>
      </div>
    </div>
  );
};

export default BugDetail;