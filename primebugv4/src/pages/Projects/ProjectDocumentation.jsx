// src/pages/Projects/ProjectDocumentation.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaFileContract, FaPalette, FaFileCode, FaBook, FaFileMedical, FaPlus, FaDownload, FaHistory, FaTrash, FaUpload } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import UploadDocumentModal from '../../components/Modals/UploadDocumentModal';

const categoryIcons = {
    ERS: <FaFileContract className="text-blue-500" />,
    Diseño: <FaPalette className="text-purple-500" />,
    API: <FaFileCode className="text-green-500" />,
    Manual: <FaBook className="text-orange-500" />,
    Otro: <FaFileMedical className="text-gray-500" />
};

// --- Componentes de la Página ---

const KeyDocumentCard = ({ type, documents, onUpload }) => {
    const latestDoc = documents?.[0];
    const tooltipContent = type === 'ERS' ? 'Especificación de Requerimientos de Software' : 'Documento de Diseño';

    if (!latestDoc) {
        return (
            <div className="card items-center justify-center text-center bg-slate-50 border-2 border-dashed h-full">
                <div className="text-4xl text-slate-400 mb-2">{categoryIcons[type]}</div>
                <h3 className="font-bold text-slate-600">{type}</h3>
                <p className="text-sm text-slate-400 mb-4">Aún no se ha cargado ningún documento.</p>
                <button onClick={onUpload} className="btn-primary text-sm"><FaUpload className="mr-2"/> Subir Primera Versión</button>
            </div>
        );
    }

    return (
        <div className="card h-full flex flex-col">
            <div className="flex-grow">
                <div className="flex items-start justify-between">
                    <div data-tooltip-id="tooltip" data-tooltip-content={tooltipContent} className="flex items-center gap-3">
                        <div className="text-4xl">{categoryIcons[type]}</div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">{type}</h3>
                            <p className="text-sm text-slate-500">Última versión: <span className="font-bold text-indigo-600">v{latestDoc.version}</span></p>
                        </div>
                    </div>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{documents.length} versiones</span>
                </div>
                <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-slate-700 truncate font-medium">{latestDoc.name}</p>
                    <p className="text-xs text-slate-500">Subido el {latestDoc.date} por {latestDoc.userName}</p>
                </div>
            </div>
            <div className="mt-6 flex gap-3">
                <button className="btn-primary flex-1"><FaDownload className="mr-2"/> Descargar v{latestDoc.version}</button>
                <button className="btn-secondary"><FaHistory /></button>
            </div>
        </div>
    );
};

const OtherDocumentsTable = ({ documents }) => (
    <div className="card mt-8">
         <h2 className="text-xl font-bold text-slate-800 mb-4">Otros Documentos</h2>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                    <tr>
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Categoría</th>
                        <th className="p-3">Versión</th>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Autor</th>
                        <th className="p-3 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {documents.map(doc => (
                        <tr key={doc.id} className="border-b hover:bg-slate-50">
                            <td className="p-3 font-medium text-slate-800 flex items-center gap-3">
                                <span className="text-lg">{categoryIcons[doc.category]}</span>
                                {doc.name}
                            </td>
                            <td className="p-3 text-slate-500">{doc.category}</td>
                            <td className="p-3"><span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{doc.version}</span></td>
                            <td className="p-3 text-slate-500">{doc.date}</td>
                            <td className="p-3 text-slate-500">{doc.userName}</td>
                            <td className="p-3 flex justify-end gap-2">
                                <button className="text-slate-400 hover:text-indigo-600"><FaDownload /></button>
                                <button className="text-slate-400 hover:text-red-600"><FaTrash /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);


const ProjectDocumentation = () => {
    const { projectId } = useParams();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        if (!projectId) return;

        const docsRef = collection(db, 'projects', projectId, 'documents');
        const q = query(docsRef, orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedDocs = snapshot.docs.map(doc => {
                 const data = doc.data();
                 const date = data.date?.toDate ? data.date.toDate() : new Date();
                 const formattedDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

                return {
                    id: doc.id,
                    ...data,
                    date: formattedDate
                }
            });
            setDocuments(fetchedDocs);
            setLoading(false);
        }, (error) => {
            console.error("Error al cargar documentos: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId]);

    const handleUploadClick = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    // Group documents by category for display
    const ersDocs = documents.filter(doc => doc.category === 'ERS');
    const designDocs = documents.filter(doc => doc.category === 'Diseño');
    const otherDocs = documents.filter(doc => !['ERS', 'Diseño'].includes(doc.category));
    
    // --- Renderizado Condicional ---

    if (loading) {
        return (
             <div className="max-w-5xl mx-auto animate-pulse">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <div className="h-8 bg-slate-200 rounded w-72 mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-96"></div>
                    </div>
                    <div className="h-10 bg-slate-200 rounded-lg w-44"></div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 bg-slate-200 rounded-xl"></div>
                    <div className="h-64 bg-slate-200 rounded-xl"></div>
                </div>
                <div className="mt-8 h-80 bg-slate-200 rounded-xl"></div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto">
            <Tooltip id="tooltip" />
            {isModalOpen && <UploadDocumentModal projectId={projectId} onClose={handleCloseModal} />}

            <header className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Documentación del Proyecto</h1>
                    <p className="text-slate-500 mt-1">Gestiona los documentos clave y recursos de tu proyecto.</p>
                </div>
                <button onClick={handleUploadClick} className="btn-primary"><FaPlus className="mr-2" /> Subir Documento</button>
            </header>

            {/* Si no hay documentos, mostrar estado vacío */}
            {documents.length === 0 ? (
                <div className="text-center p-12 my-8 bg-white rounded-xl shadow-sm border">
                    <FaFileMedical className="mx-auto text-5xl text-slate-400" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800">Aún no hay documentos</h2>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">Empieza por subir la Especificación de Requerimientos (ERS), un Manual de Usuario, o cualquier otro recurso importante.</p>
                    <button onClick={handleUploadClick} className="btn-primary mt-6">
                       <FaUpload className="mr-2"/> Subir tu primer documento
                    </button>
                </div>
            ) : (
                <>
                    {/* --- SECCIÓN DE DOCUMENTOS CLAVE -- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <KeyDocumentCard type="ERS" documents={ersDocs} onUpload={handleUploadClick} />
                        <KeyDocumentCard type="Diseño" documents={designDocs} onUpload={handleUploadClick} />
                    </div>

                    {/* --- SECCIÓN DE OTROS DOCUMENTOS -- */}
                    {otherDocs.length > 0 && (
                        <OtherDocumentsTable documents={otherDocs} />
                    )}
                </>
            )}
        </div>
    );
};

export default ProjectDocumentation;
