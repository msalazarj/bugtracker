// src/pages/Bugs/BugDetail.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaEdit, FaUser, FaTags, FaCalendarAlt, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// --- Sub-Components ---
const BugDetailSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse p-4">
      <div className="lg:col-span-2 space-y-6"><div className="h-8 bg-gray-200 rounded w-3/4"></div><div className="h-5 bg-gray-200 rounded w-1/2"></div><div className="space-y-3 pt-6"><div className="h-20 bg-gray-200 rounded-lg"></div><div className="h-4 bg-gray-200 rounded w-full"></div></div></div>
      <div className="space-y-6"><div className="h-28 bg-gray-200 rounded-xl"></div><div className="h-28 bg-gray-200 rounded-xl"></div></div>
    </div>
);

const MetadataCard = ({ title, children }) => (
    <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 pt-3 mb-3">{title}</h3>
        <div className="p-4 pt-0">{children}</div>
    </div>
);

// --- Main Component ---
const BugDetail = () => {
    const { projectId, bugId } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    
    const [bug, setBug] = useState(null);
    const [project, setProject] = useState(null);
    const [profiles, setProfiles] = useState({});
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingComment, setEditingComment] = useState({ id: null, content: '' });

    // --- CORRECTED Data Fetching & Auth Check ---
    useEffect(() => {
        if (!bugId || !user || !projectId) return;
        
        let unsubscribeBug = () => {};
        let unsubscribeComments = () => {};

        const checkPermissionsAndFetch = async () => {
            setIsLoading(true);
            try {
                // 1. Check permissions on the PROJECT first
                const projectRef = doc(db, "projects", projectId);
                const projectSnap = await getDoc(projectRef);

                if (!projectSnap.exists() || !projectSnap.data().members.includes(user.uid)) {
                    console.error("Permission Denied: User not in project members.");
                    navigate('/proyectos');
                    return;
                }
                setProject(projectSnap.data());

                // 2. If permission is granted, set up LIVE listeners
                const bugRef = doc(db, "bugs", bugId);
                unsubscribeBug = onSnapshot(bugRef, async (bugSnap) => {
                    if (bugSnap.exists()) {
                        const bugData = { id: bugSnap.id, ...bugSnap.data() };
                        setBug(bugData);
                        // Fetch related profiles
                        const userIds = [...new Set([bugData.asignado_a, bugData.reportado_por?.id].filter(Boolean))];
                        if (userIds.length > 0) {
                            const profilesSnap = await getDocs(query(collection(db, "profiles"), where("__name__", "in", userIds)));
                            profilesSnap.forEach(p => setProfiles(prev => ({...prev, [p.id]: p.data() })));
                        }
                    } else { navigate('/proyectos'); }
                });

                const commentsQuery = query(collection(db, "bugs", bugId, "comments"), orderBy("creado_en", "asc"));
                unsubscribeComments = onSnapshot(commentsQuery, snapshot => {
                    setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
                });

            } catch (error) {
                console.error("Error fetching bug details:", error);
                navigate('/proyectos');
            } finally {
                setIsLoading(false);
            }
        };

        checkPermissionsAndFetch();

        return () => {
            unsubscribeBug();
            unsubscribeComments();
        };
    }, [bugId, projectId, user, navigate]);

    // --- Actions ---
    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;
        setIsSubmitting(true);
        await addDoc(collection(db, "bugs", bugId, "comments"), { contenido: newComment, autor_id: user.uid, autor_nombre: profile?.nombre_completo || user.email, creado_en: serverTimestamp() });
        setNewComment('');
        setIsSubmitting(false);
    };
    
    const handleUpdateComment = async () => {
        if (!editingComment.content.trim()) return;
        await updateDoc(doc(db, "bugs", bugId, "comments", editingComment.id), { contenido: editingComment.content, actualizado_en: serverTimestamp() });
        setEditingComment({ id: null, content: '' });
    };

    const handleDeleteComment = (id) => window.confirm('¿Borrar comentario?') && deleteDoc(doc(db, "bugs", bugId, "comments", id));
    
    const handleBugPropertyUpdate = (field, value) => updateDoc(doc(db, "bugs", bugId), { [field]: value, actualizado_en: serverTimestamp() });

    const assignedToUser = useMemo(() => profiles[bug?.asignado_a], [profiles, bug]);
    const reportedByUser = useMemo(() => profiles[bug?.reportado_por?.id], [profiles, bug]);

    if (isLoading || !bug) return <BugDetailSkeleton />;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                 <header>
                    <Link to={`/proyectos/${projectId}`} className="text-sm font-semibold text-indigo-600 hover:underline">{project?.nombre}</Link>
                    <h1 className="text-3xl font-bold text-gray-900 mt-1">{bug.titulo} <span className="text-gray-400">#{bug.issue_id}</span></h1>
                </header>
                <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: bug.descripcion }} />

                <div id="comments" className="pt-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Comentarios ({comments.length})</h2>
                    <div className="space-y-4">
                        {comments.map(c => (
                            <div key={c.id} className="flex items-start space-x-3">
                                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${c.autor_nombre}`} alt={c.autor_nombre} className="h-9 w-9 rounded-full mt-1" />
                                <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-sm">{c.autor_nombre}</p>
                                        <div className="text-xs text-gray-500 flex items-center">
                                            {c.actualizado_en && <span className="italic mr-2">(editado)</span>}
                                            {c.creado_en?.toDate().toLocaleString()}
                                            {c.autor_id === user.uid && (
                                                <div className="ml-2 flex gap-2">
                                                    <button onClick={() => setEditingComment({id: c.id, content: c.contenido})} className="hover:text-indigo-600"><FaEdit /></button>
                                                    <button onClick={() => handleDeleteComment(c.id)} className="hover:text-red-600"><FaTrash /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {editingComment.id === c.id ? (
                                        <div>
                                            <ReactQuill theme="snow" value={editingComment.content} onChange={val => setEditingComment(e => ({...e, content: val}))} modules={{toolbar:[['bold', 'italic'], ['link']]}} className="bg-white my-2"/>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button onClick={() => setEditingComment({id: null, content: ''})} className="btn-secondary py-1 px-3 text-sm"><FaTimes className="mr-1"/>Cancelar</button>
                                                <button onClick={handleUpdateComment} className="btn-primary py-1 px-3 text-sm"><FaSave className="mr-1"/>Guardar</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="prose prose-sm max-w-none mt-1" dangerouslySetInnerHTML={{ __html: c.contenido }} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex items-start space-x-3">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.nombre_completo}`} alt="Tu" className="h-9 w-9 rounded-full mt-1" />
                        <div className="flex-1">
                             <ReactQuill theme="snow" value={newComment} onChange={setNewComment} placeholder="Añadir un comentario..." className="bg-white rounded-lg"/>
                             <div className="flex justify-end mt-2">
                                <button onClick={handleCommentSubmit} disabled={isSubmitting} className="btn-primary"><FaSave className="mr-2"/>{isSubmitting ? 'Publicando...' : 'Publicar'}</button>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <aside className="space-y-4">
                <MetadataCard title="Estado">
                    <select value={bug.estado} onChange={e => handleBugPropertyUpdate('estado', e.target.value)} className="input-control w-full"><option>Abierto</option><option>En Progreso</option><option>Resuelto</option><option>Cerrado</option></select>
                </MetadataCard>
                <MetadataCard title="Prioridad">
                     <select value={bug.prioridad} onChange={e => handleBugPropertyUpdate('prioridad', e.target.value)} className="input-control w-full"><option>Baja</option><option>Media</option><option>Alta</option><option>Crítica</option></select>
                </MetadataCard>
                <MetadataCard title="Asignado a">{assignedToUser ? <div>{assignedToUser.nombre_completo}</div> : <p>Sin asignar</p>}</MetadataCard>
                <MetadataCard title="Reportado por">{reportedByUser ? <div>{reportedByUser.nombre_completo}</div> : <p>Desconocido</p>}</MetadataCard>
                <MetadataCard title="Fechas">
                    <p><strong>Creado:</strong> {bug.creado_en?.toDate().toLocaleDateString()}</p>
                    <p><strong>Actualizado:</strong> {bug.actualizado_en?.toDate().toLocaleDateString()}</p>
                </MetadataCard>
                <div className="flex gap-2"><Link to={`/proyectos/${projectId}/issues/editar/${bugId}`} className="btn-secondary w-full text-center">Editar</Link><button onClick={() => {if(window.confirm('¿Seguro?')) deleteDoc(doc(db, 'bugs', bugId)).then(()=> navigate(`/proyectos/${projectId}`))}} className="btn-danger w-full">Eliminar</button></div>
            </aside>
        </div>
    );
};

export default BugDetail;
