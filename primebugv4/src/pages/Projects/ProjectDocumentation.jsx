import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { uploadVersionedDoc, uploadResourceDoc, deleteResourceDoc } from '../../services/documentation';
import { 
    FaFileAlt, FaArrowLeft, FaCloudUploadAlt, FaHistory, 
    FaFilePdf, FaFileWord, FaFileCode, FaDownload, FaTrash, 
    FaSpinner, FaDatabase, FaBook, FaChevronDown, FaChevronUp, FaPlus 
} from 'react-icons/fa';

// --- UTILIDADES ---
const getFileIcon = (name) => {
    if (!name) return <FaFileAlt className="text-slate-400 text-xl" />;
    const lowerName = name.toLowerCase();
    if (lowerName.endsWith('.pdf')) return <FaFilePdf className="text-red-500 text-xl" />;
    if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return <FaFileWord className="text-blue-500 text-xl" />;
    if (lowerName.endsWith('.json') || lowerName.endsWith('.xml') || lowerName.endsWith('.sql') || lowerName.endsWith('.js')) return <FaFileCode className="text-amber-500 text-xl" />;
    return <FaFileAlt className="text-slate-400 text-xl" />;
};

const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = typeof isoString.toDate === 'function' ? isoString.toDate() : new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- COMPONENTE: TARJETA CON VERSIONADO (ERS / DISEÑO) ---
const VersionedDocCard = ({ title, description, docData, projectId, docType }) => {
    const [uploading, setUploading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        await uploadVersionedDoc(projectId, docType, file);
        setUploading(false);
        e.target.value = ''; 
    };

    const current = docData?.current;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xl">
                            {docType === 'ers' ? <FaBook /> : <FaFileAlt />}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{title}</h3>
                            <p className="text-xs text-slate-500">{description}</p>
                        </div>
                    </div>
                    {current && (
                        <span className="badge badge-success">v{current.version}.0</span>
                    )}
                </div>

                {/* Zona de Estado Actual */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4 text-center">
                    {current ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-left overflow-hidden">
                                {getFileIcon(current.name)}
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]" title={current.name}>
                                        {current.name}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">
                                        Subido por {current.uploadedBy?.name || 'Usuario'} • {formatDate(current.uploadedAt)}
                                    </p>
                                </div>
                            </div>
                            <a href={current.url} target="_blank" rel="noopener noreferrer" className="btn-secondary p-2 text-indigo-600 shrink-0" title="Descargar">
                                <FaDownload />
                            </a>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 py-2">No hay documento subido aún.</p>
                    )}
                </div>

                {/* Historial Toggle */}
                {docData?.history?.length > 0 && (
                    <div className="mb-4">
                        <button 
                            onClick={() => setShowHistory(!showHistory)} 
                            className="text-xs font-bold text-slate-500 flex items-center gap-1 hover:text-indigo-600 transition-colors"
                        >
                            <FaHistory /> Historial de versiones ({docData.history.length})
                            {showHistory ? <FaChevronUp/> : <FaChevronDown/>}
                        </button>
                        
                        {showHistory && (
                            <ul className="mt-3 space-y-2 border-l-2 border-slate-100 pl-3 animate-fade-in max-h-40 overflow-y-auto custom-scrollbar">
                                {[...docData.history].reverse().map((ver, idx) => (
                                    <li key={idx} className="flex justify-between items-center text-xs">
                                        <div className="text-slate-500">
                                            <span className="font-bold text-slate-700">v{ver.version}.0</span> - {formatDate(ver.archivedAt || ver.uploadedAt)}
                                        </div>
                                        <a href={ver.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Ver</a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* Footer: Botón de Subida */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                <label className={`btn-primary w-full cursor-pointer flex items-center justify-center gap-2 ${uploading ? 'opacity-70 pointer-events-none' : ''}`}>
                    {uploading ? <FaSpinner className="animate-spin"/> : <FaCloudUploadAlt />} 
                    <span>{current ? 'Subir Nueva Versión' : 'Subir Documento'}</span>
                    <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx" />
                </label>
            </div>
        </div>
    );
};

// --- COMPONENTE: LISTA DE OTROS RECURSOS ---
const ResourcesList = ({ projectId }) => {
    const [resources, setResources] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'projects', projectId, 'resources'), orderBy('uploadedAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setResources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [projectId]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        await uploadResourceDoc(projectId, file, "Recurso"); 
        setUploading(false);
        e.target.value = '';
    };

    const handleDelete = async (res) => {
        if (window.confirm("¿Eliminar este archivo permanentemente?")) {
            await deleteResourceDoc(projectId, res.id, res.path);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <FaDatabase className="text-amber-500" /> Otros Recursos
                    </h3>
                    <p className="text-sm text-slate-500">Manuales, Modelos de BD, Endpoints API, etc.</p>
                </div>
                <label className={`btn-secondary cursor-pointer flex items-center gap-2 text-sm ${uploading ? 'opacity-50' : ''}`}>
                    {uploading ? <FaSpinner className="animate-spin"/> : <FaPlus />} 
                    <span>Agregar Archivo</span>
                    <input type="file" className="hidden" onChange={handleUpload} />
                </label>
            </div>

            {resources.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-400 text-sm">No hay recursos adicionales.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3">Subido por</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {resources.map((res) => (
                                <tr key={res.id} className="hover:bg-slate-50 group">
                                    <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                                        {getFileIcon(res.name)}
                                        <span className="truncate max-w-[200px]" title={res.name}>{res.name}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="badge badge-neutral">{res.category || 'Varios'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">
                                        {res.uploadedBy?.name} <br/> 
                                        <span className="text-xs">{formatDate(res.uploadedAt)}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                                <FaDownload />
                                            </a>
                                            <button onClick={() => handleDelete(res)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// --- PÁGINA PRINCIPAL ---
const ProjectDocumentation = () => {
  const { projectId } = useParams();
  const [docsData, setDocsData] = useState({ ers: null, design: null });
  const [loading, setLoading] = useState(true);

  // Escuchar documentos versionados (ERS y Design)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'projects', projectId, 'docs'), (snap) => {
        const data = {};
        snap.forEach(d => { data[d.id] = d.data(); });
        setDocsData(prev => ({ ...prev, ...data }));
        setLoading(false);
    });
    return () => unsub();
  }, [projectId]);

  // =========================================================================
  // SKELETON LOADER
  // =========================================================================
  if (loading) {
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* Header Skeleton */}
            <div>
                <div className="inline-flex items-center gap-2 text-slate-400 mb-4">
                    <FaArrowLeft size={14} /> Volver al Proyecto
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                        <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse"></div>
                        <div className="h-5 w-96 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Grid Versioned Docs Skeleton */}
            <div className="grid md:grid-cols-2 gap-6 animate-pulse">
                {[1, 2].map(i => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 h-[280px] flex flex-col justify-between">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-slate-200 rounded"></div>
                                        <div className="h-3 w-40 bg-slate-100 rounded"></div>
                                    </div>
                                </div>
                                <div className="h-5 w-12 bg-slate-100 rounded-full"></div>
                            </div>
                            <div className="h-20 bg-slate-50 rounded-xl border border-slate-100 mb-4"></div>
                            <div className="h-3 w-24 bg-slate-100 rounded"></div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                            <div className="h-10 w-full bg-slate-200 rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Resources List Skeleton */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-pulse">
                <div className="flex justify-between items-center mb-6">
                    <div className="space-y-2">
                        <div className="h-6 w-40 bg-slate-200 rounded"></div>
                        <div className="h-4 w-60 bg-slate-100 rounded"></div>
                    </div>
                    <div className="h-9 w-32 bg-slate-200 rounded-lg"></div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50">
                            <div className="w-8 h-8 bg-slate-100 rounded"></div>
                            <div className="h-4 w-48 bg-slate-100 rounded"></div>
                            <div className="h-4 w-24 bg-slate-100 rounded ml-auto"></div>
                            <div className="h-4 w-32 bg-slate-100 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <Link to={`/proyectos/${projectId}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors mb-4">
            <FaArrowLeft size={14} /> Volver al Proyecto
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Documentación</h1>
                <p className="text-slate-500 mt-1 text-lg">Repositorio centralizado de especificaciones y recursos.</p>
            </div>
        </div>
      </div>

      {/* SECCIÓN 1: DOCUMENTOS CRÍTICOS (ERS y Diseño) */}
      <div className="grid md:grid-cols-2 gap-6">
        <VersionedDocCard 
            title="Documento ERS"
            description="Especificación de Requisitos de Software. Versionado automático."
            docData={docsData.ers}
            projectId={projectId}
            docType="ers"
        />
        <VersionedDocCard 
            title="Documento de Diseño"
            description="Arquitectura, diagramas y decisiones técnicas. Versionado automático."
            docData={docsData.design}
            projectId={projectId}
            docType="design"
        />
      </div>

      {/* SECCIÓN 2: OTROS RECURSOS */}
      <ResourcesList projectId={projectId} />
    </div>
  );
};

export default ProjectDocumentation;