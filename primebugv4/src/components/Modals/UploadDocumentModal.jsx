
// src/components/Modals/UploadDocumentModal.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaUpload, FaFileAlt, FaTimes, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';

const UploadDocumentModal = ({ projectId, onClose }) => {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [version, setVersion] = useState('1.0');
    const [category, setCategory] = useState('Otro');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);

    const onDrop = useCallback(acceptedFiles => {
        const selectedFile = acceptedFiles[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: { 'application/pdf': ['.pdf'], 'application/json': ['.json'], 'text/plain': ['.txt'] }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !projectId || !user) {
            setError('Falta información esencial para subir el documento.');
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadProgress(0);

        const storagePath = `projects/${projectId}/documents/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (uploadError) => {
                console.error("Error en la subida:", uploadError);
                setError('Hubo un error al subir el archivo. Inténtalo de nuevo.');
                setIsUploading(false);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    
                    const docsCollectionRef = collection(db, 'projects', projectId, 'documents');
                    await addDoc(docsCollectionRef, {
                        name: file.name,
                        url: downloadURL,
                        version,
                        category,
                        storagePath,
                        uploadedBy: user.uid,
                        userName: user.nombreCompleto,
                        date: serverTimestamp(),
                    });

                    setIsUploading(false);
                    onClose(); // Cierra el modal al completar
                } catch (firestoreError) {
                    console.error("Error al guardar en Firestore:", firestoreError);
                    setError('El archivo se subió, pero no se pudo guardar la referencia. Contacta a soporte.');
                    setIsUploading(false);
                }
            }
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Subir Nuevo Documento</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><FaTimes size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    {/* Zona de Dropzone */}
                    <div {...getRootProps()} className={`relative border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 hover:border-indigo-500'}`}>
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center justify-center">
                            <FaUpload className="text-4xl text-slate-400 mb-3" />
                            {isDragActive ?
                                <p className="text-indigo-600 font-semibold">Suelta el archivo aquí...</p> :
                                <p className="text-slate-500">Arrastra y suelta un archivo, o <span className="text-indigo-600 font-semibold">haz clic para seleccionar</span></p>
                            }
                            <p className="text-xs text-slate-400 mt-2">PDF, JSON, TXT (Max. 10MB)</p>
                        </div>
                    </div>

                    {file && !isUploading && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FaFileAlt className="text-slate-500"/>
                                <span className="text-sm font-medium text-slate-700">{file.name}</span>
                            </div>
                            <button type="button" onClick={() => setFile(null)} className="text-red-500 hover:text-red-700"><FaTimes /></button>
                        </div>
                    )}

                    {/* Inputs para Versión y Categoría */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                            <label htmlFor="version" className="block text-sm font-medium text-slate-700 mb-1">Versión</label>
                            <input type="text" id="version" value={version} onChange={e => setVersion(e.target.value)} className="input-text w-full" placeholder="Ej: 1.0, 2.1.3" required />
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                            <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="input-text w-full" required>
                                <option>Otro</option>
                                <option>ERS</option>
                                <option>Diseño</option>
                                <option>API</option>
                                <option>Manual</option>
                            </select>
                        </div>
                    </div>

                    {/* Barra de Progreso y Errores */}
                    {isUploading && (
                        <div className="mt-6">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-indigo-700">Subiendo archivo...</span>
                                <span className="text-sm font-medium text-indigo-700">{Math.round(uploadProgress)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        </div>
                    )}
                    
                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

                    {/* Botones de Acción */}
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={isUploading}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={!file || isUploading}>
                            {isUploading ? <><FaSpinner className="animate-spin mr-2"/> Subiendo...</> : 'Subir y Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadDocumentModal;
