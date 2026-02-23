import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

const getTimelineDotColor = (act) => {
    if (act.tipo === 'creacion') return 'bg-indigo-500 ring-indigo-200';
    switch(act.newValue) {
        case 'Abierto': return 'bg-blue-600 ring-blue-200';
        case 'En Progreso': return 'bg-amber-500 ring-amber-200';
        case 'Resuelto': return 'bg-emerald-600 ring-emerald-200';
        case 'Re Abierta': return 'bg-red-600 ring-red-200';
        case 'Cerrado': return 'bg-slate-700 ring-slate-200';
        default: return 'bg-slate-300 ring-slate-100';
    }
};

const getHistoryBadgeClass = (status) => {
    return getStatusColorClass(status);
};

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
    
    // VALIDACIÓN 1: Estado para prevenir doble click en cambios de estado
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const [isEditingFull, setIsEditingFull] = useState(false);
    const [editForm, setEditForm] = useState({
        titulo: '',
        descripcion: '',
        prioridad: 'Media',
        categoria: 'Bug',
        referencia_req: '',
        adjuntos: []
    });
    const [newFiles, setNewFiles] = useState([]);
    const [showResolutionModal, setShowResolutionModal] = useState(false);

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
            setEditForm(prev => ({
                ...prev,
                ...res.data,
                descripcion: res.data.descripcion || '' 
            }));
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

    useEffect(() => {
        if (bug && isEditingFull) {
            setEditForm(prev => ({
                ...prev,
                ...bug,
                descripcion: bug.descripcion || '' 
            }));
        }
    }, [isEditingFull, bug]);

    const isCreator = user?.uid === bug?.creado_Por_id;
    const isAssignee = user?.uid === bug?.asignado_a;

    // VALIDACIÓN 2: Lógica de Permisos Granular
    // a) Edición Completa: Título, Descripción, Archivos, Categoría, Req => SOLO si está ABIERTO
    const canEditFullContent = (isAssignee || isCreator) && bug?.estado === 'Abierto';

    // b) Gestión: Prioridad y Asignado A => Permitida en TODOS los estados MENOS "Cerrado"
    const canEditManagement = (isAssignee || isCreator) && bug?.estado !== 'Cerrado';

    const filterValidFiles = (filesArray) => {
        const MAX_MB = 5;
        const validFiles = filesArray.filter(f => f.size <= MAX_MB * 1024 * 1024);
        if (validFiles.length < filesArray.length) {
            alert(`Se omitieron algunos archivos porque superan el límite de ${MAX_MB}MB.`);
        }
        return validFiles;
    };

    const handleNewFilesSelect = (e) => {
        const valid = filterValidFiles(Array.from(e.target.files));
        setNewFiles(prev => [...prev, ...valid]);
        e.target.value = '';
    };

    const handleCommentFilesSelect = (e) => {
        const valid = filterValidFiles(Array.from(e.target.files));
        setCommentFiles(prev => [...prev, ...valid]);
        e.target.value = '';
    };

    const startEditing = () => {
        if (bug) {
            setEditForm({
                ...bug,
                descripcion: bug.descripcion || ''
            });
        }
        setNewFiles([]);
        setIsEditingFull(true);
    };

    const cancelEditing = () => {
        setIsEditingFull(false);
        setEditForm(bug);
        setNewFiles([]);
    };

    const handleDelete = async () => {
        if (window.confirm("⛔ ¿Estás seguro de eliminar este Bug?")) {
            try {
                await deleteDoc(doc(db, 'bugs', bugId));
                navigate(`/proyectos/${projectId}/bugs`);
            } catch (e) { alert("Error al eliminar"); }
        }
    };

    const handleStatusClick = (status) => {
        if (status === bug.estado || isUpdatingStatus) return; // Bloqueo si ya está actualizando
        status === 'Resuelto' ? setShowResolutionModal(true) : handleStatusChange(status);
    };

    const handleStatusChange = async (newStatus, resolution = null) => {
        if (isUpdatingStatus || newStatus === bug.estado) return;
        
        setIsUpdatingStatus(true); // Bloqueo botones
        try {
            await updateBugStatus(bugId, newStatus, bug.estado, resolution);
            
            // VALIDACIÓN 3 (Actualizada): Mensaje detallado de Cierre con VºBº
            if (newStatus === 'Cerrado') {
                const now = new Date();
                const dateStr = now.toLocaleDateString('es-ES', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                });
                const timeStr = now.toLocaleTimeString('es-ES', {
                    hour: '2-digit', minute: '2-digit'
                });
                
                const userName = user.displayName || user.email || 'Usuario';
                
                // Mensaje con formato específico
                const closeMsg = `🔒 Bug Cerrado, con VºBº Cliente\nPor: ${userName}\nFecha: ${dateStr} a las ${timeStr}`;
                
                await addComment(bugId, closeMsg);
            }

            setBug(prev => ({ ...prev, estado: newStatus, resolucion: resolution || null }));
            setShowResolutionModal(false);
        } catch (error) {
            console.error("Error cambiando estado:", error);
            alert("No se pudo cambiar el estado.");
        } finally {
            setIsUpdatingStatus(false); // Libero botones
        }
    };

    const handleFieldUpdate = async (field, value) => {
        if (!canEditManagement) return;
        await updateBug(bugId, { [field]: value });
        setBug(prev => ({ ...prev, [field]: value }));
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const saveFullEdit = async () => {
        if (!editForm.titulo.trim()) return alert("Título obligatorio");
        setUploadingFiles(true);
        try {
            let updatedData = { ...editForm };
            delete updatedData.id; 
            if (newFiles.length > 0) {
                const uploaded = await uploadBugAttachments(projectId, newFiles);
                const current = bug.adjuntos || [];
                updatedData.adjuntos = [...current, ...uploaded];
            }
            await updateBug(bugId, updatedData);
            setBug(prev => ({ ...prev, ...updatedData })); 
            setNewFiles([]);
            setIsEditingFull(false);
        } catch (e) { console.error(e); alert("Error al guardar"); } 
        finally { setUploadingFiles(false); }
    };

    const handleRemoveAttachment = async (url) => {
        if (window.confirm("¿Quitar adjunto?")) {
            const newAdjuntos = bug.adjuntos.filter(a => a.url !== url);
            await updateBug(bugId, { adjuntos: newAdjuntos });
            setBug(prev => ({ ...prev, adjuntos: newAdjuntos }));
            setEditForm(prev => ({ ...prev, adjuntos: newAdjuntos }));
        }
    };

    const handleSendComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() && commentFiles.length === 0) return;
        setSendingComment(true);
        try {
            let uploadedAttachments = [];
            if (commentFiles.length > 0) {
                uploadedAttachments = await uploadBugAttachments(projectId, commentFiles);
            }
            await addComment(bugId, newComment, uploadedAttachments);
            setNewComment('');
            setCommentFiles([]);
        } catch (error) {
            console.error(error);
            alert("Error al enviar comentario");
        } finally {
            setSendingComment(false);
        }
    };

    if (loading) {
        return (
            <div className={UI.PAGE_CONTAINER}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 animate-pulse">
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="h-10 w-24 bg-red-100 rounded-lg"></div>
                        <div className="h-10 w-24 bg-slate-200 rounded-lg"></div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="h-10 w-28 bg-slate-200 rounded-lg"></div>
                        <div className="h-10 w-28 bg-slate-200 rounded-lg"></div>
                        <div className="h-10 w-28 bg-slate-200 rounded-lg"></div>
                    </div>
                </div>
                <div className="mb-6 animate-pulse">
                    <div className="h-4 w-32 bg-slate-200 rounded mb-4"></div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 border-l-8 border-l-slate-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-5 w-20 bg-slate-200 rounded"></div>
                            <div className="h-4 w-28 bg-slate-100 rounded"></div>
                        </div>
                        <div className="h-8 w-3/4 bg-slate-200 rounded mb-3"></div>
                        <div className="h-8 w-1/2 bg-slate-100 rounded"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                    <div className="lg:col-span-2 space-y-6">
                        <div className={`${UI.CARD_BASE} h-64 bg-white`}></div>
                        <div className={`${UI.CARD_BASE} h-40 bg-white`}></div>
                        <div className={`${UI.CARD_BASE} h-96 bg-white`}></div>
                    </div>
                    <div className="space-y-6">
                        <div className={`${UI.CARD_BASE} h-80 bg-white`}></div>
                        <div className={`${UI.CARD_BASE} h-24 bg-white`}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!bug) return <div className="text-center p-20 text-slate-500">Bug no encontrado.</div>;

    const creator = members.find(m => m.id === bug.creado_Por_id);
    const activeCategory = isEditingFull ? editForm.categoria : bug.categoria;
    const currentCategoryConfig = getCategoryConfig(activeCategory);
    const currentPriority = isEditingFull ? editForm.prioridad : bug.prioridad;

    const renderStatusButtons = () => {
        const statuses = ['Abierto', 'En Progreso', 'Resuelto'];
        if (bug.estado === 'Resuelto' || bug.estado === 'Cerrado' || bug.estado === 'Re Abierta') {
            if (!statuses.includes('Re Abierta')) statuses.push('Re Abierta');
            if (!statuses.includes('Cerrado')) statuses.push('Cerrado');
        }

        return (
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full lg:w-auto">
                {statuses.map(status => {
                    let btnClass = "border-transparent text-slate-500 hover:bg-white hover:text-slate-700 bg-transparent";
                    
                    if (bug.estado === status) {
                        btnClass = `${getStatusStyles(status)} ring-2 ring-offset-1 ring-indigo-500/20 scale-[1.02]`;
                    }
                    
                    const isDisabled = isUpdatingStatus;

                    return (
                        <button 
                            key={status} 
                            onClick={() => handleStatusClick(status)} 
                            disabled={isDisabled}
                            className={`flex items-center justify-center px-2 py-2 rounded-lg text-[11px] font-bold transition-all border ${btnClass} !w-full sm:!w-28 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {status === 'Re Abierta' ? <><FaRedo className="inline mr-1 text-[9px]"/> Re Abrir</> : status}
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={UI.PAGE_CONTAINER}> 
            <style>{customStyles}</style>
            <ResolutionModal isOpen={showResolutionModal} onClose={() => setShowResolutionModal(false)} onConfirm={(res) => handleStatusChange('Resuelto', res)} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={handleDelete} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 bg-red-50 border border-red-100 text-red-600 font-bold text-sm rounded-lg hover:bg-red-100 hover:border-red-200 transition-all shadow-sm">
                        <FaTrash className="text-xs"/> Eliminar
                    </button>
                    {canEditFullContent && !isEditingFull && (
                        <button onClick={startEditing} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                            <FaPen className="text-indigo-500 text-xs"/> Editar
                        </button>
                    )}
                </div>
                <div className="w-full md:w-auto">{renderStatusButtons()}</div>
            </div>

            {isEditingFull && (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-scale-up shadow-sm sticky top-4 z-20">
                    <span className="text-indigo-800 font-bold text-sm flex items-center gap-2"><FaPen className="text-indigo-600"/> Modo Edición Activado</span>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={cancelEditing} className="flex-1 sm:flex-none px-4 py-2 sm:py-1.5 bg-white text-slate-600 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 shadow-sm">Cancelar</button>
                        <button onClick={saveFullEdit} disabled={uploadingFiles} className="flex-1 sm:flex-none px-4 py-2 sm:py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors">
                            {uploadingFiles ? <FaSpinner className="animate-spin"/> : <><FaSave/> Guardar</>}
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <Link to={`/proyectos/${projectId}/bugs`} className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium text-sm mb-4 transition-colors">
                    <FaArrowLeft size={12} /> Volver al Tablero
                </Link>

                <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 border-l-8 ${bug.estado === 'Re Abierta' ? 'border-l-red-600' : 'border-l-indigo-500'} overflow-hidden`}>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs border border-indigo-100 uppercase tracking-wider">{bug.numero_bug}</span>
                        <span className="text-slate-400 text-xs flex items-center gap-1"><FaClock size={10}/> {formatDate(bug.creado_en)}</span>
                    </div>

                    {isEditingFull && canEditFullContent ? (
                        <div className="w-full">
                            <input className="text-2xl sm:text-3xl font-black text-slate-800 w-full outline-none border-b-2 border-indigo-100 focus:border-indigo-500 transition-colors bg-transparent placeholder-slate-300 pb-1 break-all sm:break-words" value={editForm.titulo} onChange={(e) => setEditForm({...editForm, titulo: e.target.value})} maxLength={70} placeholder="Escribe el título..." autoFocus />
                            <div className="text-right text-[10px] text-slate-400 mt-1 font-mono">{editForm.titulo.length}/70</div>
                        </div>
                    ) : (
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight tracking-tight break-all sm:break-words">{bug.titulo}</h1>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className={`${UI.CARD_BASE} overflow-hidden`}>
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><FaFileAlt className="text-indigo-500"/> Descripción Detallada</h3>
                        </div>
                        <div className="p-6">
                            {isEditingFull && canEditFullContent ? (
                                <div className="quill-resize-container bg-white rounded-xl overflow-hidden border border-slate-200 resize-y overflow-auto min-h-[250px] shadow-inner flex flex-col">
                                    <ReactQuill 
                                        key="editor-mode" 
                                        theme="snow" 
                                        value={editForm.descripcion || ''} 
                                        onChange={(val) => setEditForm(prev => ({...prev, descripcion: val}))} 
                                        className="flex-1 flex flex-col"
                                    />
                                </div>
                            ) : (
                                <div className="text-slate-700 leading-relaxed ql-editor-display overflow-hidden break-words">
                                    <ReactQuill key="view-mode" value={bug.descripcion || ''} readOnly={true} theme="bubble" className="!p-0" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`${UI.CARD_BASE} overflow-hidden`}>
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><FaImage className="text-indigo-500" /> Evidencias y Archivos</h3>
                        </div>
                        <div className="p-6">
                            {bug.adjuntos?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {bug.adjuntos.map((file, idx) => {
                                        const isImage = file.tipo?.startsWith('image/');
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all bg-white group">
                                                <a href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 overflow-hidden flex-1">
                                                    {isImage ? (
                                                        <img src={file.url} alt={file.nombre} className="w-12 h-12 rounded-lg object-cover border border-slate-100 flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <FaFileAlt className="text-xl"/>
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-bold text-slate-700 truncate" title={file.nombre}>{file.nombre}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                            {file.tamanio ? formatFileSize(file.tamanio) : (file.tipo?.split('/')[1] || 'Archivo')}
                                                        </p>
                                                    </div>
                                                </a>
                                                {isEditingFull && canEditFullContent ? (
                                                    <button type="button" onClick={() => handleRemoveAttachment(file.url)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors ml-2"><FaTrash/></button>
                                                ) : (
                                                    <a href={file.url} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors ml-2"><FaDownload/></a>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (!isEditingFull && <p className="text-sm text-slate-400 italic text-center py-4">No hay archivos adjuntos.</p>)}

                            {isEditingFull && canEditFullContent && (
                                <div className="mt-4 border-2 border-dashed border-indigo-200 rounded-xl p-6 text-center hover:bg-indigo-50 transition-colors relative bg-indigo-50/30">
                                    <input type="file" multiple onChange={handleNewFilesSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                                    <div className="text-slate-500 text-xs">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm text-indigo-500"><FaCloudUploadAlt className="text-lg" /></div>
                                        <p className="font-bold text-indigo-600">Click o arrastra para añadir más</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Máx 5MB por archivo</p>
                                    </div>
                                    {newFiles.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-indigo-100 text-left space-y-1">
                                            {newFiles.map((f, i) => <p key={i} className="text-xs text-emerald-600 flex items-center gap-1 font-bold"><FaCheck/> {f.name} ({formatFileSize(f.size)})</p>)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`${UI.CARD_BASE} overflow-hidden flex flex-col min-h-[300px]`}>
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><FaCommentAlt className="text-indigo-500"/> Comentarios</h3>
                            <span className="bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md text-xs font-bold">{comments.length}</span>
                        </div>
                        
                        <div className="flex-1 p-6 overflow-y-auto max-h-[500px] custom-scrollbar space-y-6">
                            {comments.length === 0 ? (
                                <p className="text-center text-slate-400 text-sm italic mt-10">Aún no hay comentarios. ¡Sé el primero en aportar!</p>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className={`flex gap-4 ${comment.user.uid === user.uid ? 'flex-row-reverse' : ''}`}>
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 shadow-sm">{comment.user.name.charAt(0)}</div>
                                        <div className={`max-w-[85%] space-y-1 ${comment.user.uid === user.uid ? 'items-end flex flex-col' : ''}`}>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                                                <span className="font-bold text-slate-600">{comment.user.name}</span>
                                                <span>•</span>
                                                <span>{formatTimeAgo(comment.fecha)}</span>
                                            </div>
                                            <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${comment.user.uid === user.uid ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'} break-words`}>
                                                {comment.texto && <p className="mb-2 whitespace-pre-wrap">{comment.texto}</p>}
                                                {comment.adjuntos && comment.adjuntos.length > 0 && (
                                                    <div className="mt-2 space-y-2">
                                                        {comment.adjuntos.map((file, idx) => (
                                                            file.tipo?.startsWith('image/') ? (
                                                                <a key={idx} href={file.url} target="_blank" rel="noreferrer" className="block mt-1">
                                                                    <img src={file.url} alt={file.nombre} className="rounded-lg max-w-full max-h-64 object-cover border border-black/10 hover:opacity-95 transition-opacity"/>
                                                                </a>
                                                            ) : (
                                                                <a key={idx} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/10 hover:bg-black/20 p-2 rounded-lg transition-colors">
                                                                    <div className="w-6 h-6 bg-white/90 text-indigo-600 rounded flex items-center justify-center flex-shrink-0 text-xs"><FaFileAlt /></div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-[10px] font-bold truncate opacity-90">{file.nombre}</span>
                                                                        <span className="text-[8px] opacity-75 font-mono">{file.tamanio ? formatFileSize(file.tamanio) : ''}</span>
                                                                    </div>
                                                                </a>
                                                            )
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-slate-100 sticky bottom-0">
                            {commentFiles.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pt-4 pb-2 px-1 mb-2 custom-scrollbar border-b border-slate-100 no-scrollbar">
                                    {commentFiles.map((file, idx) => (
                                        <div key={idx} className="relative bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center gap-2 min-w-[120px] max-w-[160px] group flex-shrink-0">
                                            {file.type.startsWith('image/') ? <FaImage className="text-indigo-400"/> : <FaFileAlt className="text-slate-400"/>}
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className="text-xs text-slate-600 truncate">{file.name}</span>
                                                <span className="text-[9px] text-slate-400 font-mono">{formatFileSize(file.size)}</span>
                                            </div>
                                            <button type="button" onClick={() => setCommentFiles(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md hover:bg-red-600 transition-colors z-10 cursor-pointer"><FaTimes/></button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleSendComment} className="flex items-end gap-2">
                                <div className="relative">
                                    <input type="file" multiple onChange={handleCommentFilesSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Adjuntar archivos"/>
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-200">
                                        <FaPaperclip />
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <textarea 
                                        ref={commentInputRef} 
                                        className="w-full rounded-xl border-slate-200 pl-4 py-2 min-h-[40px] max-h-[120px] resize-none pr-12 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-colors text-sm leading-6" 
                                        placeholder="Escribe un comentario..." 
                                        value={newComment} 
                                        onChange={(e) => setNewComment(e.target.value)} 
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(e); } }} 
                                        disabled={sendingComment} 
                                    />
                                </div>
                                
                                <button type="submit" disabled={(!newComment.trim() && commentFiles.length === 0) || sendingComment} className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-50 shadow-md flex-shrink-0">
                                    {sendingComment ? <FaSpinner className="animate-spin"/> : <FaPaperPlane className="text-sm ml-[-2px]"/>}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className={`${UI.CARD_BASE} p-6 space-y-6`}>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2"><FaTag/> Configuración</div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide">Categoría</label>
                            <div className="relative group">
                                {isEditingFull && canEditFullContent && (
                                    <select className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" value={editForm.categoria} onChange={(e) => setEditForm({...editForm, categoria: e.target.value})}>
                                        <option value="Bug">Bug</option>
                                        <option value="Mejora">Mejora</option>
                                        <option value="Tarea">Tarea</option>
                                        <option value="Forma">Forma</option>
                                        <option value="Transversal">Transversal</option>
                                    </select>
                                )}
                                <div className={`flex items-center justify-between p-3 rounded-xl border ${currentCategoryConfig.color} bg-white shadow-sm transition-all ${isEditingFull && canEditFullContent ? 'ring-2 ring-indigo-50 border-indigo-200 cursor-pointer' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{currentCategoryConfig.icon}</span>
                                        <span className="font-bold text-sm">{currentCategoryConfig.label}</span>
                                    </div>
                                    {isEditingFull && canEditFullContent && <FaChevronDown className="text-xs text-indigo-400"/>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide">Prioridad</label>
                            <div className="relative group">
                                {canEditManagement && (
                                    <select className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" value={bug.prioridad} onChange={(e) => handleFieldUpdate('prioridad', e.target.value)}>
                                        <option value="Baja">Baja</option>
                                        <option value="Media">Media</option>
                                        <option value="Alta">Alta</option>
                                        <option value="Crítica">Crítica</option>
                                    </select>
                                )}
                                <div className={`flex items-center justify-between p-3 rounded-xl border bg-white shadow-sm transition-all ${canEditManagement ? 'cursor-pointer hover:border-indigo-300' : ''}`}>
                                    <span className={`font-bold text-[10px] ${getPriorityStyles(isEditingFull ? editForm.prioridad : bug.prioridad)} py-1 rounded-lg`}>
                                        {isEditingFull ? editForm.prioridad : bug.prioridad}
                                    </span>
                                    {canEditManagement ? (
                                        <FaChevronDown className="text-xs text-indigo-400"/>
                                    ) : (
                                        currentPriority === 'Crítica' && <FaExclamationTriangle className="animate-pulse text-red-500"/>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            {canEditManagement ? (
                                <UserSelect members={members} value={bug.asignado_a || ''} onChange={(id) => handleFieldUpdate('asignado_a', id)} label="Asignado a"/>
                            ) : (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide">Asignado a</label>
                                    <div className="p-3 rounded-xl border bg-slate-50 text-sm text-slate-600 font-bold">
                                        {members.find(m => m.id === bug.asignado_a)?.nombre_completo || 'Sin Asignar'}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide">Ref. Requerimiento</label>
                            {isEditingFull && canEditFullContent ? (
                                <div className="relative">
                                    <FaLink className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"/>
                                    <input type="text" className={`${UI.INPUT_TEXT} pl-8 uppercase font-mono font-bold tracking-wider`} value={editForm.referencia_req || ''} onChange={(e) => setEditForm({...editForm, referencia_req: e.target.value.toUpperCase()})} maxLength={10} placeholder="REQ-..." />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 bg-white border border-slate-100 px-1 rounded">{(editForm.referencia_req || '').length}/10</span>
                                </div>
                            ) : bug.referencia_req ? (
                                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-sm font-mono text-slate-700 shadow-sm"><FaLink className="text-slate-400"/> {bug.referencia_req}</div>
                            ) : <span className="text-slate-400 text-xs italic">No especificado</span>}
                        </div>
                    </div>

                    <div className={`${UI.CARD_BASE} p-5 flex items-center gap-4`}>
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-lg border border-indigo-100 shadow-sm"><FaUser /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Creado por</p>
                            <p className="text-sm font-bold text-slate-800">{creator?.nombre_completo || bug.creado_por_nombre || '...'}</p>
                        </div>
                    </div>

                    <div className={`${UI.CARD_BASE}`}>
                        <div className="px-5 py-3 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50"><FaHistory/> Historial</div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            <div className="p-5 pl-6">
                                <div className="relative border-l-2 border-slate-100 ml-2 space-y-6">
                                    {activity.map((act, idx) => (
                                        <div key={idx} className="relative pl-6">
                                            <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ring-1 ${getTimelineDotColor(act)}`}></div>
                                            <div className="text-[11px] text-slate-600 leading-tight flex flex-wrap gap-1 items-center">
                                                <span className="font-bold text-slate-800 truncate max-w-[80px]" title={act.user.name}>{act.user.name || 'Usuario'}</span>
                                                <span className="truncate">{act.descripcion.replace(/cambió el estado de .* a .*/, 'cambió estado')}</span>
                                                <span className="text-[10px] text-slate-400 ml-auto whitespace-nowrap">{formatTimeAgo(act.fecha)}</span>
                                            </div>
                                            {act.oldValue && act.newValue && (
                                                <div className="mt-1 flex items-center gap-1.5">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getHistoryBadgeClass(act.oldValue)} opacity-60 line-through`}>{act.oldValue}</span>
                                                    <FaArrowRight className="text-[8px] text-slate-300"/>
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getHistoryBadgeClass(act.newValue)}`}>{act.newValue}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
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