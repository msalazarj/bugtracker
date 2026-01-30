// src/pages/Projects/ProjectDocumentation.jsx
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaWrench } from 'react-icons/fa';

const ProjectDocumentation = () => {
  const { projectId } = useParams();

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
      <FaWrench className="mx-auto text-5xl text-slate-300" />
      <h1 className="mt-6 text-2xl font-bold text-slate-800">Sección en Construcción</h1>
      <p className="mt-2 text-slate-500">La funcionalidad para gestionar la documentación del proyecto estará disponible aquí muy pronto.</p>
      <div className="mt-8 space-x-4">
        <Link to={`/proyectos/${projectId}/detalles`} className="btn-secondary">Volver a Detalles</Link>
        <Link to="/dashboard" className="btn-primary">Ir al Dashboard</Link>
      </div>
    </div>
  );
};

export default ProjectDocumentation;
