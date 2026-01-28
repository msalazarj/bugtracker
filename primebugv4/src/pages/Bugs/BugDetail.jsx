import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, updateDoc, collection, addDoc, 
  onSnapshot, query, orderBy, serverTimestamp, deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

import {
  FaEdit, FaTrash, FaPaperclip, FaCommentDots, FaSave, FaTimes, FaUserEdit, FaPlus, FaDownload,
  FaBug, FaAngleDown, FaCheckCircle, FaProjectDiagram, FaTags, FaUser, FaUserCheck, FaCalendarPlus,
  FaHistory, FaLongArrowAltRight, FaExclamationTriangle,
  FaInfoCircle // CORRECCIÓN: Icono añadido para que compile satisfactoriamente
} from 'react-icons/fa';

import { getStatusBadgeClass, getPriorityBadgeClass, getResolutionBadgeClass } from '../../utils/styleHelpers';

const opcionesResolucion = ['Completada', 'No Aplica', 'Duplicada', 'Información Insuficiente', 'No se puede reproducir'];

const BugDetail = () => {
  const { bugId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, profile: currentProfile } = useAuth();
  
  const [bug, setBug] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isResolveDropdownOpen, setIsResolveDropdownOpen] = useState(false);
  
  const resolveDropdownRef = useRef(null);

  useEffect(() => {
    if (!bugId) return;

    const bugRef = doc(db, "bugs", bugId);
    
    const unsubscribeBug = onSnapshot(bugRef, (docSnap) => {
      if (docSnap.exists()) {
        setBug({ id: docSnap.id, ...docSnap.data() });
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    });

    const q = query(collection(db, "bugs", bugId, "comments"), orderBy("creado_en", "asc"));
    const unsubscribeComments = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setComments(docs);
    });

    return () => {
      unsubscribeBug();
      unsubscribeComments();
    };
  }, [bugId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setIsSubmittingComment(true);
    try {
      await addDoc(collection(db, "bugs", bugId, "comments"), {
        contenido: newComment,
        autor: {
          id: currentUser.uid,
          nombre_completo: currentProfile?.nombre_completo || currentUser.email
        },
        creado_en: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      console.error("Error al comentar:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const updateBugField = async (fields) => {
    try {
      const bugRef = doc(db, "bugs", bugId);
      await updateDoc(bugRef, {
        ...fields,
        actualizado_en: serverTimestamp()
      });
      
      await addDoc(collection(db, "bugs", bugId, "history"), {
        usuario: currentProfile?.nombre_completo || currentUser.email,
        fecha: serverTimestamp(),
        ...fields
      });
    } catch (error) {
      alert("Error al actualizar: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de eliminar este bug?")) {
      await deleteDoc(doc(db, "bugs", bugId));
      navigate('/dashboard');
    }
  };

  if (isLoading) return <div className="p-6 text-center animate-pulse text-slate-500">Cargando detalle del Bug...</div>;
  if (!bug) return <div className="p-6 text-center text-red-500 font-bold">Bug no encontrado.</div>;

  const dateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };

  return (
    <div className="container mx-auto p-4 sm:p-6 text-slate-900">
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              <FaProjectDiagram /> <span>{bug.proyecto_nombre || 'Proyecto'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center tracking-tight">
              <FaBug className="mr-3 text-indigo-500 text-xl"/>
              <span>{bug.titulo}</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <span className={`px-4 py-1.5 text-xs font-black rounded-full uppercase tracking-tighter ${getStatusBadgeClass(bug.estado)}`}>
              {bug.estado}
            </span>
            {bug.resolucion && (
              <span className={`px-4 py-1.5 text-xs font-black rounded-full uppercase tracking-tighter ${getResolutionBadgeClass(bug.resolucion)}`}>
                {bug.resolucion}
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-slate-50 mt-6 pt-6 flex flex-wrap gap-3">
            <button onClick={() => updateBugField({ estado: 'En Progreso' })} className="btn-secondary text-xs">Iniciar Progreso</button>
            
            <div className="relative" ref={resolveDropdownRef}>
              <button onClick={() => setIsResolveDropdownOpen(!isResolveDropdownOpen)} className="btn-secondary text-xs flex items-center">
                Resolver <FaAngleDown className="ml-2"/>
              </button>
              {isResolveDropdownOpen && (
                <div className="absolute left-0 mt-2 w-52 bg-white border border-slate-100 rounded-xl shadow-xl z-20 overflow-hidden">
                  {opcionesResolucion.map(res => (
                    <button key={res} onClick={() => { updateBugField({ estado: 'Resuelto', resolucion: res }); setIsResolveDropdownOpen(false); }} className="block w-full text-left px-4 py-3 text-xs font-medium hover:bg-slate-50 transition-colors">{res}</button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => updateBugField({ estado: 'Cerrado' })} className="btn-secondary text-xs">Cerrar</button>
            
            <Link to={`/proyectos/${bug.proyecto_id}/issues/${bug.id}/edit`} className="btn-primary text-xs flex items-center">
              <FaEdit className="mr-2"/> Editar
            </Link>
            <button onClick={handleDelete} className="btn-secondary text-xs flex items-center text-red-600 border-red-100 hover:bg-red-50">
              <FaTrash className="mr-2"/> Eliminar
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-container bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-50 pb-3">
              <FaInfoCircle className="text-indigo-400"/> Descripción
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: bug.descripcion }} />
          </div>

          <div className="card-container bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3">Comentarios ({comments.length})</h2>
            <div className="space-y-6 mb-8">
              {comments.map(c => (
                <div key={c.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm shadow-sm border border-indigo-100">
                    {c.autor.nombre_completo[0]}
                  </div>
                  <div className="flex-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xs text-slate-800">{c.autor.nombre_completo}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {c.creado_en?.toDate().toLocaleString('es-CL', dateTimeFormatOptions)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{c.contenido}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleCommentSubmit} className="relative">
              <textarea 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] resize-none"
                placeholder="Escribe una actualización técnica o comentario..."
                rows="3"
              />
              <div className="flex justify-end mt-3">
                <button disabled={isSubmittingComment} className="btn-primary bg-indigo-600 text-white font-bold py-2 px-8 rounded-xl text-xs hover:bg-indigo-700 transition-all">
                  {isSubmittingComment ? 'Enviando...' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-container bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3">Propiedades</h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Prioridad</span>
                <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase ${getPriorityBadgeClass(bug.prioridad)}`}>{bug.prioridad}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                <span className="text-xs font-bold text-slate-400 uppercase">Tipo</span>
                <span className="text-xs font-black text-slate-700">{bug.tipo}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                <span className="text-xs font-bold text-slate-400 uppercase">Asignado</span>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                    {bug.asignado_a_nombre || 'Sin asignar'}
                </span>
              </div>
              <div className="pt-6 border-t border-slate-50 mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <FaCalendarPlus className="text-slate-300 text-xs"/>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    Creado: {bug.creado_en?.toDate().toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaHistory className="text-slate-300 text-xs"/>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    Update: {bug.actualizado_en?.toDate().toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BugDetail;