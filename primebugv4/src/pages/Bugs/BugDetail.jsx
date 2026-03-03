import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DOMPurify from 'dompurify'; // Seguridad XSS aplicada
import { 
    getBugById, updateBug, updateBugStatus, addComment, 
    subscribeToComments, subscribeToActivity, uploadBugAttachments 
} from '../../services/bugs';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import ReactQuill from 'react-quill'; 
import 'react-quill/dist/quill.bubble.css'; 
import 'react-quill/dist/quill.snow.css'; 

// --- IMPORTS DESIGN SYSTEM ---
import { 
    getStatusStyles, getPriorityStyles, getCategoryConfig, 
    getStatusColorClass, formatDate, formatTimeAgo, UI 
} from '../../utils/design';

import UserSelect from '../../components/Form/UserSelect';

import { 
    FaArrowLeft, FaSpinner, FaPaperclip, FaUser, FaClock, FaTag, 
    FaLink, FaFileAlt, FaDownload, FaHistory, 
    FaCommentAlt, FaTimes, 
    FaArrowRight, FaCheck, FaPen, FaSave, FaTrash, FaRedo, 
    FaCloudUploadAlt, FaExclamationTriangle, FaChevronDown, FaPaperPlane, FaImage
} from 'react-icons/fa';

// --- STYLES FOR QUILL RESIZE ---
const customStyles = `
    .quill-resize-container .quill { display: flex; flex-direction: column; height: 100%; }
    .quill-resize-container .ql-container { flex: 1; overflow-y: auto; border-bottom-left-radius: 0.75rem; border-bottom-right-radius: 0.75rem; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// OPTIMIZACIÓN: Memoización del ítem de actividad para evitar re-renders al escribir comentarios
const ActivityTimelineItem = React.memo(({ act }) => {
    const getTimelineDotColor = (item) => {
        if (item.tipo === 'creacion') return 'bg-indigo-500 ring-indigo-200';
        switch(item.newValue) {
            case 'Abierto': return 'bg-blue-600 ring-blue-200';
            case 'En Progreso': return 'bg-amber-500 ring-amber-200';
            case 'Resuelto': return 'bg-emerald-600 ring-emerald-200';
            case 'Re Abierta': return 'bg-red-600 ring-red-200';
            case 'Cerrado': return 'bg-slate-700 ring-slate-200';
            default: return 'bg-slate-300 ring-slate-100';
        }
    };

    return (
        <div className="relative pl-6">
            <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ring-1 ${getTimelineDotColor(act)}`}></div>
            <div className="text-[11px] text-slate-600 leading-tight flex flex-wrap gap-1 items-center">
                <span className="font-bold text-slate-800 truncate max-w-[80px]" title={act.user.name}>{act.user.name || 'Usuario'}</span>
                <span className="truncate">{act.descripcion.replace(/cambió el estado de .* a .*/, 'cambió estado')}</span>
                <span className="text-[10px] text-slate-400 ml-auto whitespace-nowrap">{formatTimeAgo(act.fecha)}</span>
            </div>
            {act.oldValue && act.newValue && (
                <div className="mt-1 flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getStatusColorClass(act.oldValue)} opacity-60 line-through`}>{act.oldValue}</span>
                    <FaArrowRight className="text-[8px] text-slate-300"/>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getStatusColorClass(act.newValue)}`}>{act.newValue}</span>
                </div>
            )}
        </div>
    );
});

const ResolutionModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    const options = ['Completado', 'Nuevo Requerimiento', 'Duplicada', 'No Aplica'];
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Resolver Bug</h3>
                <p className="text-sm text-slate-500 mb-4">Selecciona el motivo:</p>
                <div className="space-y-2">
                    {options.map(opt => (
                        <button key={opt} onClick={() => onConfirm(opt)} className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 font-medium transition-colors">
                            {opt}
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="mt-4 w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-bold">Cancelar</button>
            </div>
        </div>
    );
};

const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const BugDetail = () => {
    const { projectId, bugId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const commentInputRef = useRef(null);

    const [bug, setBug] = useState(null);
    const [comments, setComments] = useState([]);
    const [activity, setActivity] = useState([]);
    const [members, setMembers] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [commentFiles, setCommentFiles] = useState([]);
    
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isEditingFull, setIsEditingFull] = useState(false);
    const [editForm, setEditForm] = useState({
        titulo: '', descripcion: '', prioridad: 'Media', categoria: 'Bug', referencia_req: '', adjuntos: []
    });
    const [newFiles, setNewFiles] = useState([]);
    const [showResolutionModal, setShowResolutionModal] = useState(false);

    // SEGURIDAD: Sanitización de la descripción cargada
    const sanitizedDescription = useMemo(() => {
        return bug?.descripcion ? DOMPurify.sanitize(bug.descripcion) : '';
    }, [bug?.descripcion]);

    const loadMembers = useCallback(async (pid) => {
        try {
            const pDoc = await getDoc(doc(db, 'projects', pid));
            if (pDoc.exists()) {
                const mIds = pDoc.data().members || [];
                const promises = mIds.map(uid => getDoc(doc(db, 'profiles', uid)));
                const snaps = await Promise.all(promises);
                setMembers(snaps.map(s => ({ id: s.id, ...s.data() })));
            }
        } catch (e) { console.error(e); }
    }, []);

    const loadBug = useCallback(async () => {
        setLoading(true);
        const res = await getBugById(bugId);
        if (res.success) {
            setBug(res.data);
            setEditForm(prev => ({ ...prev, ...res.data, descripcion: res.data.descripcion || '' }));
            loadMembers(res.data.proyecto_id);
        }
        setLoading(false);
    }, [bugId, loadMembers]);

    useEffect(() => {
        loadBug();
        const unsubComments = subscribeToComments(bugId, setComments);
        const unsubActivity = subscribeToActivity(bugId, setActivity);
        return () => { unsubComments(); unsubActivity(); };
    }, [loadBug, bugId]);

    const isCreator = user?.uid === bug?.creado_Por_id;
    const isAssignee = user?.uid === bug?.asignado_a;
    const canEditFullContent = (isAssignee || isCreator) && bug?.estado === 'Abierto';
    const canEditManagement = (isAssignee || isCreator) && bug?.estado !== 'Cerrado';

    const handleNewFilesSelect = (e) => {
        const valid = Array.from(e.target.files).filter(f => f.size <= 5 * 1024 * 1024);
        setNewFiles(prev => [...prev, ...valid]);
        e.target.value = '';
    };

    const handleCommentFilesSelect = (e) => {
        const valid = Array.from(e.target.files).filter(f => f.size <= 5 * 1024 * 1024);
        setCommentFiles(prev => [...prev, ...valid]);
        e.target.value = '';
    };

    const startEditing = () => {
        if (bug) setEditForm({ ...bug, descripcion: bug.descripcion || '' });
        setNewFiles([]);
        setIsEditingFull(true);
    };

    const cancelEditing = () => {
        setIsEditingFull(false);
        setEditForm(bug);
        setNewFiles([]);
    };

    const handleStatusClick = (status) => {
        if (status === bug.estado || isUpdatingStatus) return;
        status === 'Resuelto' ? setShowResolutionModal(true) : handleStatusChange(status);
    };

    const handleStatusChange = async (newStatus, resolution = null) => {
        if (isUpdatingStatus || newStatus === bug.estado) return;
        setIsUpdatingStatus(true);
        try {
            await updateBugStatus(bugId, newStatus, bug.estado, resolution);
            if (newStatus === 'Cerrado') {
                const now = new Date();
                const closeMsg = `🔒 Bug Cerrado, con VºBº Cliente\nPor: ${user.displayName || user.email}\nFecha: ${now.toLocaleDateString()} a las ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                await addComment(bugId, closeMsg);
            }
            setBug(prev => ({ ...prev, estado: newStatus, resolucion: resolution || null }));
            setShowResolutionModal(false);
        } catch (error) { alert("Error al cambiar estado"); } 
        finally { setIsUpdatingStatus(false); }
    };

    const handleFieldUpdate = async (field, value) => {
        if (!canEditManagement) return;
        await updateBug(bugId, { [field]: value });
        setBug(prev => ({ ...prev, [field]: value }));
    };

    const saveFullEdit = async () => {
        if (!editForm.titulo.trim()) return alert("Título obligatorio");
        setUploadingFiles(true);
        try {
            let updatedData = { ...editForm };
            delete updatedData.id; 
            if (newFiles.length > 0) {
                const uploaded = await uploadBugAttachments(projectId, newFiles);
                updatedData.adjuntos = [...(bug.adjuntos || []), ...uploaded];
            }
            await updateBug(bugId, updatedData);
            setBug(prev => ({ ...prev, ...updatedData })); 
            setIsEditingFull(false);
        } catch (e) { alert("Error al guardar"); } 
        finally { setUploadingFiles(false); }
    };

    const handleSendComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() && commentFiles.length === 0) return;
        setSendingComment(true);
        try {
            let uploaded = [];
            if (commentFiles.length > 0) uploaded = await uploadBugAttachments(projectId, commentFiles);
            await addComment(bugId, newComment, uploaded);
            setNewComment('');
            setCommentFiles([]);
        } catch (error) { alert("Error al comentar"); } 
        finally { setSendingComment(false); }
    };

    if (loading) return <div className={UI.PAGE_CONTAINER}><div className="animate-pulse space-y-6"><div className="h-10 bg-slate-200 w-1/4 rounded"></div><div className="h-64 bg-slate-100 rounded-2xl"></div></div></div>;
    if (!bug) return <div className="text-center p-20 text-slate-500">Bug no encontrado.</div>;

    const currentCategoryConfig = getCategoryConfig(isEditingFull ? editForm.categoria : bug.categoria);

    return (
        <div className={UI.PAGE_CONTAINER}> 
            <style>{customStyles}</style>
            <ResolutionModal isOpen={showResolutionModal} onClose={() => setShowResolutionModal(false)} onConfirm={(res) => handleStatusChange('Resuelto', res)} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={() => {if(window.confirm("⛔ ¿Eliminar?")) deleteDoc(doc(db, 'bugs', bugId)).then(()=>navigate(`/proyectos/${projectId}/bugs`))}} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 text-red-600 font-bold text-sm rounded-lg hover:bg-red-100 transition-all shadow-sm"><FaTrash className="text-xs"/> Eliminar</button>
                    {canEditFullContent && !isEditingFull && <button onClick={startEditing} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 transition-all shadow-sm"><FaPen className="text-indigo-500 text-xs"/> Editar</button>}
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full lg:w-auto">
                    {['Abierto', 'En Progreso', 'Resuelto', 'Re Abierta', 'Cerrado'].filter(s => s !== 'Re Abierta' || ['Resuelto', 'Cerrado'].includes(bug.estado)).map(status => (
                        <button key={status} onClick={() => handleStatusClick(status)} disabled={isUpdatingStatus} className={`flex items-center justify-center px-2 py-2 rounded-lg text-[11px] font-bold transition-all border sm:w-28 ${bug.estado === status ? `${getStatusStyles(status)} ring-2 ring-offset-1 ring-indigo-500/20 scale-[1.02]` : 'border-transparent text-slate-500 hover:bg-white'}`}>
                            {status === 'Re Abierta' ? <><FaRedo className="inline mr-1 text-[9px]"/> Re Abrir</> : status}
                        </button>
                    ))}
                </div>
            </div>

            {isEditingFull && (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-scale-in shadow-sm sticky top-4 z-20">
                    <span className="text-indigo-800 font-bold text-sm flex items-center gap-2"><FaPen className="text-indigo-600"/> Modo Edición Activado</span>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={cancelEditing} className="flex-1 px-4 py-1.5 bg-white text-slate-600 rounded-lg text-xs font-bold border border-slate-200">Cancelar</button>
                        <button onClick={saveFullEdit} disabled={uploadingFiles} className="flex-1 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md flex items-center justify-center gap-2">{uploadingFiles ? <FaSpinner className="animate-spin"/> : <><FaSave/> Guardar</>}</button>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <Link to={`/proyectos/${projectId}/bugs`} className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium text-sm mb-4"><FaArrowLeft size={12} /> Volver al Tablero</Link>
                <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 border-l-8 ${bug.estado === 'Re Abierta' ? 'border-l-red-600' : 'border-l-indigo-500'} overflow-hidden`}>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs border border-indigo-100 uppercase tracking-wider">{bug.numero_bug}</span>
                        <span className="text-slate-400 text-xs flex items-center gap-1"><FaClock size={10}/> {formatDate(bug.creado_en)}</span>
                    </div>
                    {isEditingFull ? <input className="text-2xl sm:text-3xl font-black text-slate-800 w-full outline-none border-b-2 border-indigo-100 focus:border-indigo-500 bg-transparent" value={editForm.titulo} onChange={(e) => setEditForm({...editForm, titulo: e.target.value})} maxLength={70} autoFocus /> : <h1 className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight break-words">{bug.titulo}</h1>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className={`${UI.CARD_BASE} overflow-hidden`}>
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50"><h3 className="font-bold text-slate-800 flex items-center gap-2"><FaFileAlt className="text-indigo-500"/> Descripción Detallada</h3></div>
                        <div className="p-6">
                            {isEditingFull ? (
                                <div className="quill-resize-container bg-white rounded-xl border border-slate-200 min-h-[250px] shadow-inner flex flex-col overflow-hidden">
                                    <ReactQuill theme="snow" value={editForm.descripcion} onChange={(val) => setEditForm(prev => ({...prev, descripcion: val}))} className="flex-1" />
                                </div>
                            ) : (
                                <div className="text-slate-700 leading-relaxed ql-editor-display break-words" dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
                            )}
                        </div>
                    </div>

                    <div className={`${UI.CARD_BASE} overflow-hidden`}>
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50"><h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><FaImage className="text-indigo-500" /> Evidencias y Archivos</h3></div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {bug.adjuntos?.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all bg-white group">
                                        <a href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 overflow-hidden flex-1">
                                            {file.tipo?.startsWith('image/') ? <img src={file.url} alt="" className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0"><FaFileAlt className="text-xl"/></div>}
                                            <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-700 truncate">{file.nombre}</p><p className="text-[10px] text-slate-400 font-mono">{formatFileSize(file.tamanio)}</p></div>
                                        </a>
                                        {isEditingFull ? <button onClick={() => updateBug(bugId, { adjuntos: bug.adjuntos.filter(a => a.url !== file.url) }).then(()=>setBug(p=>({...p, adjuntos: p.adjuntos.filter(a=>a.url!==file.url)})))} className="text-slate-300 hover:text-red-500 p-2"><FaTrash/></button> : <a href={file.url} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-indigo-600 p-2"><FaDownload/></a>}
                                    </div>
                                ))}
                            </div>
                            {isEditingFull && <div className="mt-4 border-2 border-dashed border-indigo-200 rounded-xl p-6 text-center relative bg-indigo-50/30"><input type="file" multiple onChange={handleNewFilesSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/><FaCloudUploadAlt className="mx-auto text-indigo-500 text-2xl mb-2"/><p className="text-xs font-bold text-indigo-600">Añadir más archivos</p></div>}
                        </div>
                    </div>

                    <div className={`${UI.CARD_BASE} overflow-hidden flex flex-col min-h-[300px]`}>
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h3 className="font-bold text-slate-800 flex items-center gap-2"><FaCommentAlt className="text-indigo-500"/> Comentarios</h3><span className="bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md text-xs font-bold">{comments.length}</span></div>
                        <div className="flex-1 p-6 overflow-y-auto max-h-[500px] custom-scrollbar space-y-6">
                            {comments.length === 0 ? <p className="text-center text-slate-400 text-sm italic mt-10">Sin comentarios aún.</p> : comments.map((comment) => (
                                <div key={comment.id} className={`flex gap-4 ${comment.user.uid === user.uid ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 shadow-sm">{comment.user.name.charAt(0)}</div>
                                    <div className={`max-w-[85%] space-y-1 ${comment.user.uid === user.uid ? 'items-end flex flex-col' : ''}`}>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1"><span className="font-bold text-slate-600">{comment.user.name}</span><span>•</span><span>{formatTimeAgo(comment.fecha)}</span></div>
                                        <div className={`p-3 rounded-2xl text-sm shadow-sm ${comment.user.uid === user.uid ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'} break-words`}>
                                            {comment.texto && <p className="mb-2 whitespace-pre-wrap">{comment.texto}</p>}
                                            {comment.adjuntos?.map((f, i) => (
                                                <a key={i} href={f.url} target="_blank" rel="noreferrer" className="block mt-2">{f.tipo?.startsWith('image/') ? <img src={f.url} alt="" className="rounded-lg max-h-64 object-cover border border-black/10" /> : <div className="flex items-center gap-2 bg-black/10 p-2 rounded-lg text-xs"><FaFileAlt/> {f.nombre}</div>}</a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-white border-t border-slate-100 sticky bottom-0">
                            {commentFiles.length > 0 && <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">{commentFiles.map((f, i) => <div key={i} className="relative bg-slate-50 border p-2 rounded-lg text-[10px] truncate max-w-[120px]">{f.name}<button onClick={() => setCommentFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-md"><FaTimes/></button></div>)}</div>}
                            <form onSubmit={handleSendComment} className="flex items-end gap-2">
                                <div className="relative"><input type="file" multiple onChange={handleCommentFilesSelect} className="absolute inset-0 opacity-0 cursor-pointer"/><div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500 hover:text-indigo-600 transition-colors"><FaPaperclip /></div></div>
                                <textarea className="flex-1 rounded-xl border-slate-200 pl-4 py-2 min-h-[40px] max-h-[120px] resize-none text-sm leading-6 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="Comentar..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(e); } }} disabled={sendingComment} />
                                <button type="submit" disabled={(!newComment.trim() && commentFiles.length === 0) || sendingComment} className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-50 shadow-md hover:bg-indigo-700 transition-colors">{sendingComment ? <FaSpinner className="animate-spin"/> : <FaPaperPlane className="text-sm"/>}</button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className={`${UI.CARD_BASE} p-6 space-y-6`}>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2"><FaTag/> Configuración</div>
                        <div><label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide">Categoría</label>
                            <div className="relative">{isEditingFull && canEditFullContent && <select className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" value={editForm.categoria} onChange={(e) => setEditForm({...editForm, categoria: e.target.value})}><option value="Bug">Bug</option><option value="Mejora">Mejora</option><option value="Tarea">Tarea</option><option value="Forma">Forma</option><option value="Transversal">Transversal</option></select>}
                            <div className={`flex items-center justify-between p-3 rounded-xl border ${currentCategoryConfig.color} bg-white shadow-sm`}><div className="flex items-center gap-3"><span className="text-lg">{currentCategoryConfig.icon}</span><span className="font-bold text-sm">{currentCategoryConfig.label}</span></div>{isEditingFull && canEditFullContent && <FaChevronDown className="text-xs text-indigo-400"/>}</div></div>
                        </div>
                        <div><label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide">Prioridad</label>
                            <div className="relative">{canEditManagement && <select className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" value={bug.prioridad} onChange={(e) => handleFieldUpdate('prioridad', e.target.value)}><option value="Baja">Baja</option><option value="Media">Media</option><option value="Alta">Alta</option><option value="Crítica">Crítica</option></select>}
                            <div className="flex items-center justify-between p-3 rounded-xl border bg-white shadow-sm transition-all"><span className={`font-bold text-[10px] ${getPriorityStyles(isEditingFull ? editForm.prioridad : bug.prioridad)} py-1 rounded-lg`}>{isEditingFull ? editForm.prioridad : bug.prioridad}</span>{canEditManagement && <FaChevronDown className="text-xs text-indigo-400"/>}</div></div>
                        </div>
                        <div>{canEditManagement ? <UserSelect members={members} value={bug.asignado_a || ''} onChange={(id) => handleFieldUpdate('asignado_a', id)} label="Asignado a"/> : <div><label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide">Asignado a</label><div className="p-3 rounded-xl border bg-slate-50 text-sm text-slate-600 font-bold">{members.find(m => m.id === bug.asignado_a)?.nombre_completo || 'Sin Asignar'}</div></div>}</div>
                        <div><label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide">Ref. Requerimiento</label>
                            {isEditingFull && canEditFullContent ? <input type="text" className={`${UI.INPUT_TEXT} uppercase font-mono font-bold tracking-wider`} value={editForm.referencia_req || ''} onChange={(e) => setEditForm({...editForm, referencia_req: e.target.value.toUpperCase()})} maxLength={10} placeholder="REQ-..." /> : <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-sm font-mono text-slate-700 shadow-sm"><FaLink className="text-slate-400"/> {bug.referencia_req || 'N/A'}</div>}
                        </div>
                    </div>

                    <div className={`${UI.CARD_BASE} p-5 flex items-center gap-4`}><div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-lg border border-indigo-100 shadow-sm"><FaUser /></div><div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Creado por</p><p className="text-sm font-bold text-slate-800">{members.find(m => m.id === bug.creado_Por_id)?.nombre_completo || bug.creado_por_nombre || '...'}</p></div></div>

                    <div className={`${UI.CARD_BASE}`}>
                        <div className="px-5 py-3 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50"><FaHistory/> Historial</div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar p-5 pl-6"><div className="relative border-l-2 border-slate-100 ml-2 space-y-6">{activity.map((act, idx) => <ActivityTimelineItem key={idx} act={act} />)}</div></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BugDetail;