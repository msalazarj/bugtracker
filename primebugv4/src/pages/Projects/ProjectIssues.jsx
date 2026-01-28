// src/pages/Projects/ProjectIssues.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaPlus, FaBug } from 'react-icons/fa';

const ProjectIssues = () => {
  const { projectId } = useParams();
  const [bugs, setBugs] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !projectId) return;

    const fetchProjectAndBugs = async () => {
      setLoading(true);
      try {
        // 1. Verificar acceso al proyecto
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists() && projectSnap.data().members.includes(user.uid)) {
          setProject({ id: projectSnap.id, ...projectSnap.data() });

          // 2. Escuchar los bugs de este proyecto
          const bugsQuery = query(collection(db, "bugs"), where("proyecto_id", "==", projectId));
          const unsubscribe = onSnapshot(bugsQuery, (snapshot) => {
            const bugsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBugs(bugsData);
            setLoading(false);
          });
          return unsubscribe; // Devolver para limpiar el listener
        } else {
          // No tiene acceso o el proyecto no existe
          setProject(null);
          setBugs([]);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error al cargar issues del proyecto:", error.message);
        setLoading(false);
      }
    };

    let unsubscribe;
    fetchProjectAndBugs().then(res => unsubscribe = res);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [projectId, user]);

  if (loading) {
    return <div className="p-6 text-center">Cargando issues...</div>;
  }

  if (!project) {
    return <div className="p-6 text-center text-red-500">Acceso denegado o el proyecto no existe.</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bugs de: {project.nombre}</h1>
            <Link to={`/proyectos/${projectId}/crear-bug`} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-sm hover:bg-indigo-700">
                <FaPlus className="mr-2"/> Reportar Bug
            </Link>
        </div>

        {bugs.length > 0 ? (
             <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Título</th>
                            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Prioridad</th>
                            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Asignado a</th>
                            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {bugs.map(bug => (
                            <tr key={bug.id} className="hover:bg-gray-50">
                                <td className="p-4 text-sm font-bold text-gray-800">
                                    <Link to={`/proyectos/${projectId}/issues/${bug.id}`} className="hover:underline text-indigo-600">
                                        {bug.titulo}
                                    </Link>
                                </td>
                                <td className="p-4 text-sm"><span className={`px-2 py-1 text-xs font-bold rounded-full ${bug.estado === 'Abierto' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{bug.estado}</span></td>
                                <td className="p-4 text-sm text-gray-600">{bug.prioridad}</td>
                                <td className="p-4 text-sm text-gray-600">{bug.asignado_a_nombre || 'Sin asignar'}</td>
                                <td className="p-4 text-sm text-gray-500">{bug.creado_en?.toDate().toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="text-center bg-white p-10 rounded-lg shadow-sm">
                <FaBug className="mx-auto text-4xl text-gray-300"/>
                <h3 className="mt-4 text-lg font-bold text-gray-800">¡Todo en orden!</h3>
                <p className="mt-2 text-sm text-gray-500">No se han reportado bugs en este proyecto todavía.</p>
                 <Link to={`/proyectos/${projectId}/crear-bug`} className="mt-6 inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-sm hover:bg-indigo-700">
                    Reportar el primer bug
                </Link>
            </div>
        )}
    </div>
  );
};

export default ProjectIssues;
