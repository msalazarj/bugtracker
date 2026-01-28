// src/pages/Projects/ProjectDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !projectId) return;

    setLoading(true);
    const docRef = doc(db, "projects", projectId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        // Verificar si el usuario es miembro antes de mostrar los datos
        const projectData = docSnap.data();
        if (projectData.members && projectData.members.includes(user.uid)) {
          setProject({ id: docSnap.id, ...projectData });
        } else {
          setProject(null); // No tiene permiso
        }
      } else {
        setProject(null); // No encontrado
      }
      setLoading(false);
    }, (error) => {
        console.error("Error al cargar el proyecto (ProjectDetail):", error.message);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId, user]);

  if (loading) {
    return <div className="p-6 text-center">Cargando detalle del proyecto...</div>;
  }

  if (!project) {
    return <div className="p-6 text-center text-red-500">Acceso denegado o el proyecto no existe.</div>;
  }

  return (
    <div className="p-4 sm:p-6">
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-900">{project.nombre}</h1>
            <p className="mt-2 text-gray-600">{project.descripcion}</p>
            <div className="mt-4 pt-4 border-t">
                <p><strong>Miembros:</strong> {project.members.length}</p>
                {/* Aquí puedes agregar más detalles o componentes */}
            </div>
        </div>
    </div>
  );
};

export default ProjectDetail;
