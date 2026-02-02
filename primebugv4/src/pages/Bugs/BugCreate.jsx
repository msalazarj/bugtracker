// src/pages/Bugs/BugCreate.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, updateDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {
    FaSave, FaTimes, FaTasks, FaBug, FaLightbulb, 
    FaStar, FaPaperclip, FaTrash, FaSpinner
} from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './BugCreate.css'; // Import custom styles

// --- Reusable Components ---
const Card = ({ children, className = '' }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ${className}`}>
        {children}
    </div>
);

const FieldWrapper = ({ label, children, required, description }) => (
    <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {description && <p className="text-xs text-slate-500">{description}</p>}
        {children}
    </div>
);

const ButtonGroupSelector = ({ options, selectedValue, onSelect, disabled = false }) => (
    <div className="flex flex-nowrap gap-2">
        {options.map(({ value, label, icon }) => {
            const isSelected = selectedValue === value;
            return (
                <button type="button" key={value} onClick={() => onSelect(value)} disabled={disabled}
                    className={`flex items-center px-3 py-1.5 text-sm font-semibold rounded-md border transition-all whitespace-nowrap ${isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 disabled:bg-slate-50 disabled:cursor-not-allowed'
                    }`}>
                    {icon && <span className="mr-2 text-base">{icon}</span>}{label}
                </button>
            );
        })}
    </div>
);

// --- Main Component ---
const BugCreate = () => {
    const { projectId: urlProjectId, bugId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditMode = Boolean(bugId);

    // Form and UI State
    const [formData, setFormData] = useState({ /* Initial State */ });
    const [projectMembers, setProjectMembers] = useState([]);
    const [userProjects, setUserProjects] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingAttachments, setExistingAttachments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Fetches members for a given project ID using the original (Array) logic
    const loadProjectMembers = useCallback(async (projectId) => {
        if (!projectId) {
            setProjectMembers([]);
            return;
        }
        try {
            const projectRef = doc(db, 'projects', projectId);
            const projectSnap = await getDoc(projectRef);
            if (projectSnap.exists()) {
                const memberIds = projectSnap.data().members || [];
                if (memberIds.length > 0) {
                    const profilesQuery = query(collection(db, 'profiles'), where('__name__', 'in', memberIds));
                    const profilesSnap = await getDocs(profilesQuery);
                    const memberDetails = profilesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setProjectMembers(memberDetails);
                } else {
                    setProjectMembers([]);
                }
            }
        } catch (err) {
            console.error("Error loading project members:", err);
            setError("Error al cargar los miembros del proyecto. Verifica los permisos.");
            setProjectMembers([]);
        }
    }, []);

    // Initial data load (projects, and bug data if in edit mode)
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                // Correct query for when 'members' is an array
                const projectsQuery = query(collection(db, "projects"), where("members", "array-contains", user.uid));
                const projectsSnap = await getDocs(projectsQuery);
                const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setUserProjects(projects);

                let initialData = {
                    titulo: '', descripcion: '', proyecto_id: urlProjectId || '',
                    asignado_a: '', prioridad: 'Media', estado: 'Abierto',
                    tipo: 'Bug', adjuntos: []
                };

                if (isEditMode) {
                    const bugRef = doc(db, 'bugs', bugId);
                    const bugSnap = await getDoc(bugRef);
                    if (bugSnap.exists()) {
                        const bugData = bugSnap.data();
                        initialData = { ...initialData, ...bugData };
                        setExistingAttachments(bugData.adjuntos || []);
                    } else {
                        setError("El bug que intentas editar no existe.");
                    }
                }
                setFormData(initialData);

                // Pre-load members if a project is already selected (e.g., in edit mode)
                if (initialData.proyecto_id) {
                    await loadProjectMembers(initialData.proyecto_id);
                }

            } catch (err) {
                console.error(err);
                setError("No se pudieron cargar los datos necesarios.");
            }
            setIsLoading(false);
        };
        fetchInitialData();
    }, [user, isEditMode, bugId, urlProjectId, loadProjectMembers]);

    // Reload members when the selected project changes
    useEffect(() => {
        if (formData.proyecto_id) {
            loadProjectMembers(formData.proyecto_id);
        }
    }, [formData.proyecto_id, loadProjectMembers]);

    // Handlers
    const handleFormChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    const handleFileChange = (e) => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)]);
    const removeNewFile = (fileName) => setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
    const removeExistingFile = (fileUrl) => setExistingAttachments(prev => prev.filter(file => file.url !== fileUrl));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.titulo || !formData.proyecto_id) {
            setError('El título y el proyecto son obligatorios.');
            return;
        }
        setIsSubmitting(true);
        setError('');

        try {
            const storage = getStorage();
            const uploadedFiles = await Promise.all(
                selectedFiles.map(async (file) => {
                    const fileRef = ref(storage, `bug-attachments/${formData.proyecto_id}/${Date.now()}-${file.name}`);
                    await uploadBytes(fileRef, file);
                    const url = await getDownloadURL(fileRef);
                    return { name: file.name, url: url };
                })
            );

            const finalAttachments = [...existingAttachments, ...uploadedFiles];
            const dataToSave = { ...formData, adjuntos: finalAttachments, updatedAt: serverTimestamp() };

            if (isEditMode) {
                const bugRef = doc(db, 'bugs', bugId);
                await updateDoc(bugRef, dataToSave);
            } else {
                const project = userProjects.find(p => p.id === formData.proyecto_id);
                await addDoc(collection(db, 'bugs'), {
                    ...dataToSave,
                    creado_por: user.uid,
                    createdAt: serverTimestamp(),
                    numero_incidencia: `${project?.sigla_incidencia || 'BUG'}-...`
                });
            }
            navigate(`/proyectos/${formData.proyecto_id}/bugs`);
        } catch (err) {
            setError('Error al guardar el bug. Inténtalo de nuevo.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Options for selectors
    const TIPO_OPTIONS = [ { value: 'Bug', label: 'Bug', icon: <FaBug /> }, { value: 'Mejora', label: 'Mejora', icon: <FaLightbulb /> }, { value: 'Tarea', label: 'Tarea', icon: <FaTasks /> }, { value: 'Funcionalidad', label: 'Funcionalidad', icon: <FaStar /> }];
    const PRIORIDAD_OPTIONS = [ { value: 'Baja', label: 'Baja' }, { value: 'Media', label: 'Media' }, { value: 'Alta', label: 'Alta' }, { value: 'Crítica', label: 'Crítica' } ];

    if (isLoading) return <div className="flex justify-center items-center py-20"><FaSpinner className="animate-spin text-4xl text-indigo-500"/></div>;

    return (
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{isEditMode ? 'Editar Bug' : 'Crear Nuevo Bug'}</h1>
                <p className="text-slate-500 mt-1">Rellena los detalles para documentar, asignar y priorizar el trabajo.</p>
            </header>

            {error && <div className="bg-red-50 p-4 rounded-xl text-red-800 border border-red-200 font-semibold">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
                {/* --- Left Column --- */}
                <div className="lg:col-span-7 space-y-8">
                    <Card>
                        <div className="space-y-6">
                            <FieldWrapper label="Título del Bug" required>
                                <input type="text" value={formData.titulo} onChange={e => handleFormChange('titulo', e.target.value)} className="input-text w-full" placeholder="Ej: El botón de login no responde en Firefox" />
                            </FieldWrapper>
                            <FieldWrapper label="Proyecto" required>
                                <select value={formData.proyecto_id} onChange={e => handleFormChange('proyecto_id', e.target.value)} className="input-text w-full" disabled={isEditMode}>
                                    <option value="">Selecciona un proyecto</option>
                                    {userProjects.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                            </FieldWrapper>
                        </div>
                    </Card>
                    <Card>
                        <FieldWrapper label="Descripción y Detalles" required>
                            <div className="quill-container">
                                <ReactQuill theme="snow" value={formData.descripcion} onChange={v => handleFormChange('descripcion', v)} placeholder="Describe el bug detalladamente: pasos para reproducirlo, comportamiento esperado y actual..." />
                            </div>
                        </FieldWrapper>
                    </Card>
                </div>

                {/* --- Right Column --- */}
                <div className="lg:col-span-5 space-y-8 mt-8 lg:mt-0">
                    <Card>
                        <div className="space-y-6">
                            <FieldWrapper label="Tipo de Bug">
                                <ButtonGroupSelector options={TIPO_OPTIONS} selectedValue={formData.tipo} onSelect={(v) => handleFormChange('tipo', v)} />
                            </FieldWrapper>
                             <FieldWrapper label="Prioridad">
                                <ButtonGroupSelector options={PRIORIDAD_OPTIONS} selectedValue={formData.prioridad} onSelect={(v) => handleFormChange('prioridad', v)} />
                            </FieldWrapper>
                            <FieldWrapper label="Asignar a" description="Elige un miembro del proyecto para que se encargue de este bug.">
                                <select value={formData.asignado_a} onChange={e => handleFormChange('asignado_a', e.target.value)} className="input-text w-full" disabled={!formData.proyecto_id || projectMembers.length === 0}>
                                    <option value="">Sin asignar</option>
                                    {projectMembers.map(m => <option key={m.id} value={m.id}>{m.fullName || m.email}</option>)}
                                </select>
                            </FieldWrapper>
                        </div>
                    </Card>
                    <Card>
                        <FieldWrapper label="Archivos Adjuntos">
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors duration-200">
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-2 text-slate-500 hover:text-indigo-600">
                                    <FaPaperclip className="text-3xl" />
                                    <span className="font-semibold text-sm">Haz clic para seleccionar archivos</span>
                                    <span className="text-xs">Tamaño máximo: 5MB por archivo</span>
                                </label>
                                <input id="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                            </div>
                            
                            {(existingAttachments.length > 0 || selectedFiles.length > 0) && (
                                <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                                    {existingAttachments.map((file, i) => 
                                        <div key={`ex-${i}`} className="flex items-center justify-between bg-slate-50 p-2 pl-3 rounded-md text-sm font-medium text-slate-700">
                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 truncate pr-2">{file.name}</a>
                                            <button type="button" onClick={() => removeExistingFile(file.url)} className="p-1 text-slate-500 hover:text-red-600 rounded-full flex-shrink-0"><FaTrash /></button>
                                        </div>
                                    )}
                                    {selectedFiles.map((file, i) => 
                                        <div key={`new-${i}`} className="flex items-center justify-between bg-blue-50 p-2 pl-3 rounded-md text-sm font-medium text-blue-800">
                                            <span className="truncate pr-2">{file.name}</span>
                                            <button type="button" onClick={() => removeNewFile(file.name)} className="p-1 text-blue-500 hover:text-red-600 rounded-full flex-shrink-0"><FaTrash /></button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </FieldWrapper>
                    </Card>
                </div>
            </div>

            <footer className="flex justify-end items-center gap-3 pt-4">
                <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                    <FaTimes className="mr-2" />Cancelar
                </button>
                <button type="submit" disabled={isSubmitting || isLoading} className="btn-primary">
                    {isSubmitting ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                    {isSubmitting ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Bug')}
                </button>
            </footer>
        </form>
    );
};

export default BugCreate;
