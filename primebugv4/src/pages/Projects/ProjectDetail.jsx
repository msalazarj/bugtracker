import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProjectById, updateProject, deleteProject } from '../../services/projects'; 
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '../../firebase';

// --- DESIGN SYSTEM ---
import { UI, formatDate } from '../../utils/design';
import { 
    FaBug, FaUsers, FaFileAlt, FaClock, FaEdit, FaSave, FaTimes, FaSpinner, 
    FaCheckCircle, FaPauseCircle, FaStopCircle, FaArrowLeft, FaTrash, FaExclamationTriangle 
} from 'react-icons/fa';

// Definición de Estados y Colores
const PROJECT_STATUS = {
    ACTIVE: 'Activo',
    STAND_BY: 'Stand By',
    CLOSED: 'Cerrado'
};

const STATUS_CONFIG = {
    [PROJECT_STATUS.ACTIVE]: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: FaCheckCircle },
    [PROJECT_STATUS.STAND_BY]: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: FaPauseCircle },
    [PROJECT_STATUS.CLOSED]: { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: FaStopCircle },
};

const ProjectDetail = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Estados de Datos
    const [project, setProject] = useState(null);
    const [creatorName, setCreatorName] = useState('Cargando...');
    const [loading, setLoading] = useState(true);

    // Estados de UI (Modales)
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false); // Modal eliminar
    const [isSaving, setIsSaving] = useState(false); // Loading para guardar/borrar
    const [editForm, setEditForm] = useState({ description: '', status: '' });

    useEffect(() => {
        loadProject();
    }, [projectId]);

    const loadProject = async () => {
        setLoading(true);
        const res = await getProjectById(projectId);
        if (res.success) {
            setProject(res.data);
            
            if (res.data.creadoPor) {
                try {
                    const userDoc = await getDoc(doc(db, 'profiles', res.data.creadoPor));
                    if (userDoc.exists()) {
                        setCreatorName(userDoc.data().nombre_completo || 'Usuario');
                    }
                } catch (e) {}
            }

            setEditForm({
                description: res.data.descripcion || '',
                status: res.data.status || PROJECT_STATUS.ACTIVE
            });
        }
        setLoading(false);
    };

    // --- HANDLERS ---

    const handleEditClick = () => {
        setEditForm({
            description: project.descripcion || '',
            status: project.status || PROJECT_STATUS.ACTIVE
        });
        setIsEditing(true);
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const updates = { descripcion: editForm.description, status: editForm.status };
        const res = await updateProject(projectId, updates);
        if (res.success) {
            setProject(prev => ({ ...prev, ...updates }));
            setIsEditing(false);
        } else {
            alert("Error al actualizar el proyecto");
        }
        setIsSaving(false);
    };

    const handleDelete = async () => {
        setIsSaving(true);
        const res = await deleteProject(projectId);
        if (res.success) {
            navigate('/proyectos'); // Redirigir al listado tras borrar
        } else {
            alert("Error al eliminar: " + res.error);
            setIsSaving(false);
            setIsDeleting(false);
        }
    };

    // =========================================================================
    // SKELETON LOADER (Cero Parpadeos Blancos)
    // =========================================================================
    if (loading) {
        return (
            <div className={UI.PAGE_CONTAINER}>
                <div className="inline-flex items-center gap-2 text-slate-400 mb-6">
                    <FaArrowLeft size={12} /> Volver a Proyectos
                </div>

                {/* Header Card Skeleton */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-10 relative overflow-hidden animate-pulse">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-6 w-16 bg-slate-200 rounded-lg"></div>
                                <div className="h-6 w-24 bg-slate-100 rounded-full"></div>
                            </div>
                            
                            <div className="h-10 w-2/3 bg-slate-200 rounded-xl mb-6 max-w-md"></div>
                            
                            <div className="space-y-3 mb-8">
                                <div className="h-4 w-full max-w-3xl bg-slate-100 rounded"></div>
                                <div className="h-4 w-4/5 max-w-2xl bg-slate-100 rounded"></div>
                            </div>

                            <div className="flex items-center gap-6 border-t border-slate-100 pt-5">
                                <div className="h-5 w-32 bg-slate-200 rounded"></div>
                                <div className="h-5 w-40 bg-slate-100 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-4 w-32 bg-slate-200 rounded mb-5 animate-pulse"></div>

                {/* Acciones Directas Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-200 shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                                <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!project) return <div className="p-10 text-center">Proyecto no encontrado.</div>;

    const currentStatus = project.status || PROJECT_STATUS.ACTIVE;
    const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG[PROJECT_STATUS.ACTIVE];
    const StatusIcon = statusConfig.icon;
    const isOwner = user && project.creadoPor === user.uid;

    return (
        <div className={UI.PAGE_CONTAINER}>
            
            <Link to="/proyectos" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium mb-6 transition-colors">
                <FaArrowLeft size={12} /> Volver a Proyectos
            </Link>

            {/* --- HEADER DEL PROYECTO --- */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                    <span className="text-9xl font-black text-slate-900">{project.sigla_bug}</span>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold font-mono tracking-wider">
                                {project.sigla_bug}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusConfig.color}`}>
                                <StatusIcon /> {currentStatus}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-4">
                            <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
                                {project.nombre}
                            </h1>
                            {isOwner && (
                                <div className="flex gap-2">
                                    <button onClick={handleEditClick} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center transition-colors" title="Editar">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => setIsDeleting(true)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors" title="Eliminar Proyecto">
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <p className="text-slate-500 text-lg mb-6 max-w-3xl leading-relaxed">
                            {project.descripcion || 'Sin descripción detallada.'}
                        </p>

                        <div className="flex items-center gap-6 text-sm text-slate-400 border-t border-slate-100 pt-4 w-fit">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-500">Creador:</span>
                                <span className="text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-medium">{creatorName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaClock /> <span>Iniciado el {formatDate(project.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Accesos Directos</h3>

            {/* --- BOTONES DE GESTIÓN MODERNOS (GRID) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <Link to="bugs" className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                        <FaBug />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Tablero de Bugs</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Gestión de incidencias</p>
                    </div>
                </Link>

                <Link to="miembros" className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                        <FaUsers />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Equipo</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Miembros y permisos</p>
                    </div>
                </Link>

                <Link to="documentacion" className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                        <FaFileAlt />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 group-hover:text-amber-600 transition-colors">Documentación</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Archivos y recursos</p>
                    </div>
                </Link>

            </div>

            {/* --- MODAL DE EDICIÓN --- */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <FaEdit className="text-indigo-600"/> Editar Proyecto
                            </h3>
                            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleSaveChanges} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Estado</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.values(PROJECT_STATUS).map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setEditForm({...editForm, status})}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                                                editForm.status === status
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Descripción</label>
                                <textarea 
                                    className={`${UI.INPUT_TEXT} min-h-[120px] resize-none`}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsEditing(false)} className={UI.BTN_SECONDARY}>Cancelar</button>
                                <button type="submit" disabled={isSaving} className={`${UI.BTN_PRIMARY} px-6`}>
                                    {isSaving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL DE ELIMINACIÓN (Danger Zone) --- */}
            {isDeleting && (
                <div className="fixed inset-0 bg-red-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up border-2 border-red-100">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaExclamationTriangle size={30} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">¿Eliminar Proyecto?</h3>
                            <p className="text-slate-500 mb-6 leading-relaxed text-sm">
                                Estás a punto de eliminar <strong>{project.nombre}</strong>. <br/>
                                Esta acción es irreversible y se perderá todo el historial de bugs asociado.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleDelete} 
                                    disabled={isSaving}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-200 flex justify-center items-center gap-2"
                                >
                                    {isSaving ? <FaSpinner className="animate-spin"/> : <FaTrash />}
                                    {isSaving ? 'Eliminando...' : 'Sí, eliminar definitivamente'}
                                </button>
                                <button 
                                    onClick={() => setIsDeleting(false)} 
                                    disabled={isSaving}
                                    className="w-full bg-white text-slate-600 hover:bg-slate-50 font-bold py-3 rounded-xl border border-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ProjectDetail;