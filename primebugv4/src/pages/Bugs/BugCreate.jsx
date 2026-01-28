// src/pages/Bugs/BugCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';

const BugCreate = () => {
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [proyectoId, setProyectoId] = useState('');
    const [userProjects, setUserProjects] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user, profile } = useAuth(); // Perfil del usuario para obtener el nombre
    const { projectId: urlProjectId } = useParams();

    useEffect(() => {
        if (!user) return;
        const fetchProjects = async () => {
            const q = query(collection(db, 'projects'), where('members', 'array-contains', user.uid));
            const snap = await getDocs(q);
            const projects = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUserProjects(projects);
            if (urlProjectId && projects.some(p => p.id === urlProjectId)) {
                setProyectoId(urlProjectId);
            }
        };
        fetchProjects();
    }, [user, urlProjectId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!titulo || !proyectoId) {
            setError('El título y el proyecto son obligatorios.');
            return;
        }
        if (!user || !profile) {
            setError("Tu perfil de usuario no está completamente cargado. Por favor, espera un momento y vuelve a intentarlo.");
            return;
        }

        setLoading(true);
        setError('');

        const selectedProject = userProjects.find(p => p.id === proyectoId);
        if (!selectedProject) {
            setError('El proyecto seleccionado no es válido.');
            setLoading(false);
            return;
        }

        try {
            await addDoc(collection(db, 'bugs'), {
                titulo,
                descripcion,
                proyecto_id: proyectoId,
                proyecto_nombre: selectedProject.nombre,      // CORREGIDO: Añadir nombre del proyecto
                creado_por_id: user.uid,
                creado_por_nombre: profile.nombre_completo, // CORREGIDO: Añadir nombre del creador
                creado_en: serverTimestamp(),
                estado: 'Abierto',
                prioridad: 'Normal',
                asignado_a_id: null,                          // Null por defecto
                asignado_a_nombre: '',                      // Vacío por defecto
            });
            navigate(`/proyectos/${proyectoId}/issues`);
        } catch (err) {
            console.error("Error al crear el bug (BugCreate):", err.message);
            setError('Hubo un error al crear el bug.');
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Reportar Nuevo Bug</h1>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="proyecto" className="block text-sm font-bold text-gray-600 mb-2">Proyecto</label>
                        <select 
                            id="proyecto" 
                            value={proyectoId} 
                            onChange={e => setProyectoId(e.target.value)} 
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            <option value="">Selecciona un proyecto</option>
                            {userProjects.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="titulo" className="block text-sm font-bold text-gray-600 mb-2">Título del Bug</label>
                        <input type="text" id="titulo" value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div>
                        <label htmlFor="descripcion" className="block text-sm font-bold text-gray-600 mb-2">Descripción Detallada</label>
                        <textarea id="descripcion" rows="4" value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:opacity-50">
                        {loading ? 'Reportando...' : 'Reportar Bug'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BugCreate;
