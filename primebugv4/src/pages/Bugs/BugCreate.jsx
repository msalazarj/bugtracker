// src/pages/Bugs/BugCreate.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, updateDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaSave, FaTimes, FaUser, FaTag, FaTasks, FaBug, FaLightbulb, FaStar, FaPaperclip, FaTrash, FaSpinner } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// --- Sub-Components ---

const FieldWrapper = ({ label, children, required }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const ButtonGroupSelector = ({ options, selectedValue, onSelect }) => (
    <div className="flex flex-wrap gap-2">
        {options.map(({ value, label, icon }) => {
            const isSelected = selectedValue === value;
            return (
                <button type="button" key={value} onClick={() => onSelect(value)}
                    className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}>
                    {icon && <span className="mr-2">{icon}</span>}{label}
                </button>
            );
        })}
    </div>
);

// --- Main Component ---

const BugCreate = () => {
    const { projectId: urlProjectId, bugId } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const isEditMode = Boolean(bugId);

    // Form & Data State
    const [formData, setFormData] = useState({ /* initial state */ });
    const [projectMembers, setProjectMembers] = useState([]);
    const [userProjects, setUserProjects] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    
    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // -- Data Loading --
    const loadProjectMembers = useCallback(async (projectId) => {
        if (!projectId) {
            setProjectMembers([]);
            return;
        }
        try {
            const projectRef = doc(db, "projects", projectId);
            const projectSnap = await getDoc(projectRef);
            if (projectSnap.exists()) {
                const projectData = projectSnap.data();
                const memberUIDs = projectData.members || [];
                if (memberUIDs.length > 0) {
                    const profilesQuery = query(collection(db, 'profiles'), where('__name__', 'in', memberUIDs));
                    const profilesSnap = await getDocs(profilesQuery);
                    setProjectMembers(profilesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                }
            }
        } catch (err) { console.error("Error loading project members:", err); }
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const projectsQuery = query(collection(db, 'projects'), where('members', 'array-contains', user.uid));
                const projectsSnap = await getDocs(projectsQuery);
                setUserProjects(projectsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                
                let initialProjectId = urlProjectId;
                if (isEditMode) {
                    const bugRef = doc(db, 'bugs', bugId);
                    const bugSnap = await getDoc(bugRef);
                    if (bugSnap.exists()) {
                        const bugData = bugSnap.data();
                        setFormData(bugData);
                        initialProjectId = bugData.proyecto_id;
                    } else {
                        setError("El issue que intentas editar no existe.");
                    }
                } else {
                     setFormData({
                        titulo: '', descripcion: '', proyecto_id: urlProjectId || '',
                        asignado_a: '', prioridad: 'Media', estado: 'Abierto',
                        tipo: 'Bug', adjuntos: []
                    });
                }
                if(initialProjectId) await loadProjectMembers(initialProjectId);

            } catch (err) { setError("No se pudieron cargar los datos necesarios."); }
            setIsLoading(false);
        };
        fetchInitialData();
    }, [user, isEditMode, bugId, urlProjectId, loadProjectMembers]);

    useEffect(() => {
        if (formData.proyecto_id) loadProjectMembers(formData.proyecto_id);
    }, [formData.proyecto_id, loadProjectMembers]);

    // -- Handlers --
    const handleFormChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    const handleFileChange = (e) => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)]);
    const removeFile = (fileName) => setSelectedFiles(prev => prev.filter(file => file.name !== fileName));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.titulo || !formData.proyecto_id) {
            setError('El título y el proyecto son obligatorios.'); return;
        }
        setIsSubmitting(true); setError('');
        try {
            let bugDataToSave = { ...formData };
            const docId = isEditMode ? bugId : (await addDoc(collection(db, 'bugs'), {})).id;

            if (selectedFiles.length > 0) {
                const storage = getStorage();
                const uploadPromises = selectedFiles.map(async file => {
                    const fileRef = ref(storage, `attachments/${docId}/${file.name}`);
                    await uploadBytes(fileRef, file);
                    const downloadURL = await getDownloadURL(fileRef);
                    return { name: file.name, url: downloadURL, size: file.size, type: file.type };
                });
                bugDataToSave.adjuntos = [...formData.adjuntos, ...(await Promise.all(uploadPromises))];
            }
            
            const bugRef = doc(db, 'bugs', docId);
            const commonData = {
                ...bugDataToSave,
                actualizado_en: serverTimestamp(),
            };
            if(isEditMode) {
                await updateDoc(bugRef, commonData);
            } else {
                await updateDoc(bugRef, {
                    ...commonData,
                    creado_en: serverTimestamp(),
                    reportado_por: { id: user.uid, nombre: profile?.nombre_completo || user.email },
                    issue_id: `${userProjects.find(p=>p.id === formData.proyecto_id)?.sigla_incidencia}-${docId.substring(0,5).toUpperCase()}`
                });
            }
            
            navigate(`/proyectos/${formData.proyecto_id}`);
        } catch (err) { setError('Hubo un problema al guardar el issue.'); console.error(err); }
        finally { setIsSubmitting(false); }
    };

    const TIPO_OPTIONS = [ { value: 'Bug', label: 'Bug', icon: <FaBug /> }, { value: 'Mejora', label: 'Mejora', icon: <FaLightbulb /> }, { value: 'Tarea', label: 'Tarea', icon: <FaTasks /> }, { value: 'Nueva Característica', label: 'Funcionalidad', icon: <FaStar /> }];
    const PRIORIDAD_OPTIONS = [ { value: 'Baja', label: 'Baja' }, { value: 'Media', label: 'Media' }, { value: 'Alta', label: 'Alta' }, { value: 'Crítica', label: 'Crítica' } ];

    if (isLoading) return <div className="text-center p-10"><FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto" /></div>;

    return (
        <div className="max-w-4xl mx-auto my-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <header className="px-6 py-4 bg-gray-50 border-b flex items-center">
                    <FaBug className="text-indigo-600 mr-3" size="24" />
                    <h1 className="text-xl font-bold text-gray-800">{isEditMode ? 'Editar Issue' : 'Crear Nuevo Issue'}</h1>
                </header>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        {error && <div className="bg-red-100 p-3 rounded-md text-red-700 text-sm font-semibold">{error}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FieldWrapper label="Título" required><input type="text" value={formData.titulo} onChange={e => handleFormChange('titulo', e.target.value)} className="input-control w-full" /></FieldWrapper>
                            <FieldWrapper label="Proyecto" required>
                                <select value={formData.proyecto_id} onChange={e => handleFormChange('proyecto_id', e.target.value)} className="input-control w-full" disabled={isEditMode}>
                                    <option value="">Selecciona un proyecto</option>
                                    {userProjects.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.sigla_incidencia})</option>)}
                                </select>
                            </FieldWrapper>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <FieldWrapper label="Tipo de Issue"><ButtonGroupSelector options={TIPO_OPTIONS} selectedValue={formData.tipo} onSelect={(v) => handleFormChange('tipo', v)} /></FieldWrapper>
                           <FieldWrapper label="Prioridad"><ButtonGroupSelector options={PRIORIDAD_OPTIONS} selectedValue={formData.prioridad} onSelect={(v) => handleFormChange('prioridad', v)} /></FieldWrapper>
                        </div>

                        <FieldWrapper label="Asignar a">
                            <select value={formData.asignado_a} onChange={e => handleFormChange('asignado_a', e.target.value)} className="input-control w-full" disabled={!formData.proyecto_id}>
                                <option value="">Sin asignar</option>
                                {projectMembers.map(m => <option key={m.id} value={m.id}>{m.nombre_completo}</option>)}
                            </select>
                        </FieldWrapper>

                        <FieldWrapper label="Descripción y Detalles">
                            <ReactQuill theme="snow" value={formData.descripcion} onChange={v => handleFormChange('descripcion', v)} className="bg-white rounded-lg"/>
                        </FieldWrapper>

                        <FieldWrapper label="Archivos Adjuntos">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition">
                                <label htmlFor="file-upload" className="cursor-pointer"><FaPaperclip className="mx-auto text-gray-400 text-2xl mb-2" /> <span className="text-indigo-600 font-semibold">Selecciona archivos</span></label>
                                <input id="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                            </div>
                            <div className="mt-4 space-y-2">
                                {selectedFiles.map((file, i) => <div key={i} className="flex items-center justify-between bg-gray-100 p-2 rounded-md text-sm"><span>{file.name}</span><button type="button" onClick={() => removeFile(file.name)}><FaTrash className="text-red-500" /></button></div>)}
                                {formData.adjuntos?.map((file, i) => <div key={i} className="flex items-center justify-between bg-blue-50 p-2 rounded-md text-sm"> <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-indigo-700">{file.name}</a></div>)}
                            </div>
                        </FieldWrapper>
                    </div>

                    <footer className="flex justify-end items-center px-6 py-4 bg-gray-50 border-t space-x-3">
                        <button type="button" onClick={() => navigate(-1)} className="btn-secondary"><FaTimes className="mr-2" />Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary"><FaSave className="mr-2" />{isSubmitting ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Issue')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default BugCreate;
