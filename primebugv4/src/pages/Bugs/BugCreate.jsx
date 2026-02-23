import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { createBug, uploadBugAttachments } from '../../services/bugs';
import ReactQuill from 'react-quill'; 
import 'react-quill/dist/quill.snow.css'; 

// --- IMPORTS ---
import { getCategoryConfig, getPriorityStyles, UI } from '../../utils/design';
import UserSelect from '../../components/Form/UserSelect';

import { 
    FaArrowLeft, FaExclamationCircle, FaSpinner, FaCheck, 
    FaAlignLeft, FaHeading, FaLink, FaPaperclip, FaTimes, FaFileAlt, 
    FaCloudUploadAlt, FaLayerGroup, FaBug, FaCube, FaHashtag, FaTrashAlt
} from 'react-icons/fa';

const BugCreate = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    
    // Estados
    const [project, setProject] = useState(null);
    const [members, setMembers] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loadingProject, setLoadingProject] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [fileError, setFileError] = useState('');

    const [formData, setFormData] = useState({
        titulo: '',
        referencia_req: '',
        descripcion: '',
        prioridad: 'Media',
        categoria: 'Bug',
        asignado_a: '' 
    });

    useEffect(() => {
        const loadContext = async () => {
            try {
                const pDoc = await getDoc(doc(db, 'projects', projectId));
                if (pDoc.exists()) {
                    const pData = pDoc.data();
                    setProject(pData);
                    if (pData.members?.length > 0) {
                        const promises = pData.members.map(uid => getDoc(doc(db, 'profiles', uid)));
                        const snaps = await Promise.all(promises);
                        setMembers(snaps.map(s => ({ id: s.id, ...s.data() })));
                    }
                }
            } catch (error) { console.error(error); } 
            finally { setLoadingProject(false); }
        };
        loadContext();
    }, [projectId]);

    const handleFileSelect = (e) => {
        setFileError(''); // Limpiamos errores previos
        const newFiles = Array.from(e.target.files);
        
        // Validación visual de peso antes de subir (5MB)
        const MAX_MB = 5;
        const oversizedFiles = newFiles.filter(f => f.size > MAX_MB * 1024 * 1024);
        
        if (oversizedFiles.length > 0) {
            setFileError(`Algunos archivos superan los ${MAX_MB}MB y fueron descartados.`);
            const validFiles = newFiles.filter(f => f.size <= MAX_MB * 1024 * 1024);
            setSelectedFiles(prev => [...prev, ...validFiles]);
        } else {
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
        
        // Reseteamos el input para permitir seleccionar el mismo archivo si se borró
        e.target.value = '';
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setFileError(''); // Oculta el error si borras archivos
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Evitar que Quill envíe un tag <p><br></p> vacío como válido
        const textOnlyDescription = formData.descripcion.replace(/<[^>]*>?/gm, '').trim();
        
        if (!formData.titulo.trim() || !textOnlyDescription) {
            alert("El título y la descripción detallada son obligatorios.");
            return;
        }

        setIsSubmitting(true);
        setUploadProgress('Preparando datos...');

        try {
            let attachmentsData = [];
            
            // Si hay archivos, los subimos primero
            if (selectedFiles.length > 0) {
                setUploadProgress(`Subiendo ${selectedFiles.length} archivo(s)...`);
                attachmentsData = await uploadBugAttachments(projectId, selectedFiles);
            }

            setUploadProgress('Registrando ticket...');
            const result = await createBug({
                ...formData,
                proyecto_id: projectId,
                adjuntos: attachmentsData // Pasamos el array de URLs y metadatos generados
            });

            if (result.success) {
                navigate(`/proyectos/${projectId}/bugs`);
            } else {
                alert("Error: " + result.error);
                setIsSubmitting(false); // Liberar botón si falla
            }
        } catch (err) {
            console.error("Error en submit:", err);
            alert(err.message || "Ocurrió un error inesperado al subir los datos.");
            setIsSubmitting(false);
        }
    };

    // Función auxiliar para mostrar el peso bonito (KB/MB)
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (loadingProject) return <div className="flex justify-center p-20"><FaSpinner className="animate-spin text-3xl text-indigo-600"/></div>;

    const CATEGORY_TYPES = ['Bug', 'Mejora', 'Tarea', 'Forma', 'Transversal'];
    const PRIORITY_TYPES = ['Baja', 'Media', 'Alta', 'Crítica'];

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <Link to={`/proyectos/${projectId}/bugs`} className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium mb-2 transition-colors">
                        <FaArrowLeft size={12} /> Cancelar y Volver
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <FaBug className="text-xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reportar Bug</h1>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1"><FaCube/> {project?.nombre}</span>
                                <span className="text-slate-300">•</span>
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
                                    Ticket #{project?.sigla_bug}-{(project?.last_ticket_sequence || 0) + 1}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Formulario */}
            <div className={`${UI.CARD_BASE} p-6 md:p-8`}>
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Título */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <FaHeading className="text-indigo-500"/> Título del problema <span className="text-red-500">*</span>
                            </label>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${formData.titulo.length >= 70 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                                {formData.titulo.length}/70
                            </span>
                        </div>
                        <input 
                            type="text" 
                            className={UI.INPUT_TEXT} 
                            placeholder="Ej: Error al intentar guardar el formulario de contacto..."
                            maxLength={70} 
                            value={formData.titulo}
                            onChange={e => setFormData({...formData, titulo: e.target.value})}
                            autoFocus required
                        />
                    </div>

                    {/* Grid Propiedades */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                        
                        {/* Categoría */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <FaLayerGroup/> Categoría
                            </label>
                            <div className="space-y-2">
                                {CATEGORY_TYPES.map((catType) => {
                                    const config = getCategoryConfig(catType);
                                    const isSelected = formData.categoria === catType;
                                    return (
                                        <button
                                            key={catType}
                                            type="button"
                                            onClick={() => setFormData({...formData, categoria: catType})}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200 text-left text-sm ${
                                                isSelected
                                                ? `${config.color} ring-1 ring-offset-0 shadow-sm font-bold`
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="text-lg">{config.icon}</span>
                                            <span>{config.label}</span>
                                            {isSelected && <FaCheck className="ml-auto text-xs opacity-50"/>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Prioridad */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <FaExclamationCircle/> Prioridad
                            </label>
                            <div className="space-y-2">
                                {PRIORITY_TYPES.map((prio) => {
                                    const isSelected = formData.prioridad === prio;
                                    return (
                                        <button
                                            key={prio}
                                            type="button"
                                            onClick={() => setFormData({...formData, prioridad: prio})}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm border transition-all ${
                                                isSelected 
                                                ? `${getPriorityStyles(prio)} shadow-sm font-bold border-transparent ring-1 ring-black/5` 
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span>{prio}</span>
                                            <div className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-current' : 'bg-slate-200'}`}></div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Columna 3: Asignación y Ref */}
                        <div className="space-y-6">
                            <UserSelect 
                                members={members}
                                value={formData.asignado_a}
                                onChange={(id) => setFormData({...formData, asignado_a: id})}
                                label="Asignar a"
                            />

                            {/* Ref Req */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <FaLink/> Ref. Req.
                                    </label>
                                    <span className="text-[9px] font-bold text-slate-400 bg-white px-1 rounded border border-slate-200">
                                        {formData.referencia_req.length}/10
                                    </span>
                                </div>
                                <div className="relative">
                                    <FaHashtag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"/>
                                    <input 
                                        type="text" 
                                        maxLength={10} 
                                        className={UI.INPUT_TEXT + " pl-8 uppercase font-mono tracking-wider"} 
                                        placeholder="REQ-105"
                                        value={formData.referencia_req}
                                        onChange={e => setFormData({...formData, referencia_req: e.target.value.toUpperCase()})}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 text-right">Opcional</p>
                            </div>
                        </div>
                    </div>

                    {/* Descripción HTML */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <FaAlignLeft className="text-indigo-500"/> Descripción detallada <span className="text-red-500">*</span>
                        </label>
                        <div className="bg-white rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all shadow-sm resize-y overflow-auto min-h-[250px]">
                            <ReactQuill 
                                theme="snow"
                                value={formData.descripcion}
                                onChange={(value) => setFormData({...formData, descripcion: value})}
                                className="h-full" 
                                placeholder="Describe detalladamente los pasos para reproducir el error, comportamiento esperado vs el actual..."
                                modules={{
                                    toolbar: [
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                        ['clean']
                                    ],
                                }}
                            />
                        </div>
                    </div>

                    {/* SECCIÓN DE ADJUNTOS MEJORADA */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <FaPaperclip className="text-indigo-500"/> Archivos Adjuntos
                            </label>
                            {selectedFiles.length > 0 && (
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                    {selectedFiles.length} {selectedFiles.length === 1 ? 'archivo' : 'archivos'}
                                </span>
                            )}
                        </div>
                        
                        <div className="relative group">
                            <input 
                                type="file" 
                                multiple 
                                onChange={handleFileSelect} 
                                disabled={isSubmitting}
                                className={`absolute inset-0 w-full h-full opacity-0 z-10 ${isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            />
                            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                                isSubmitting 
                                ? 'bg-slate-100 border-slate-200 opacity-70' 
                                : 'bg-slate-50 border-slate-300 group-hover:bg-indigo-50 group-hover:border-indigo-300'
                            }`}>
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-indigo-500 group-hover:scale-110 transition-transform">
                                    <FaCloudUploadAlt className="text-2xl" />
                                </div>
                                <p className="text-sm font-medium text-slate-700">Haz clic o arrastra archivos aquí</p>
                                <p className="text-xs text-slate-400 mt-1">Imágenes, Logs o Documentos (Máx. 5MB por archivo)</p>
                            </div>
                        </div>

                        {/* Mensaje de Error de Peso */}
                        {fileError && (
                            <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg flex items-center gap-2">
                                <FaExclamationCircle /> {fileError}
                            </div>
                        )}

                        {/* Lista de archivos seleccionados */}
                        {selectedFiles.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow transition-shadow">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center flex-shrink-0">
                                                <FaFileAlt className="text-sm"/>
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-sm text-slate-700 font-medium truncate" title={file.name}>
                                                    {file.name}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {formatFileSize(file.size)}
                                                </span>
                                            </div>
                                        </div>
                                        {!isSubmitting && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeFile(index)} 
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                title="Eliminar archivo"
                                            >
                                                <FaTrashAlt size={12}/>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4">
                        <button 
                            type="button" 
                            onClick={() => navigate(-1)} 
                            disabled={isSubmitting}
                            className={`${UI.BTN_SECONDARY} w-full sm:w-auto disabled:opacity-50`}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className={`${UI.BTN_PRIMARY} w-full sm:min-w-[200px] py-3 justify-center shadow-lg shadow-indigo-200`}
                        >
                            {isSubmitting ? (
                                <><FaSpinner className="animate-spin text-lg" /> {uploadProgress}</>
                            ) : (
                                <><FaCheck className="text-lg" /> Registrar Bug</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BugCreate;