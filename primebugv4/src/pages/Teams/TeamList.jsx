// src/pages/Teams/TeamList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockTeamsData } from '../../services/teams'; 
import { FaUsers, FaFolder, FaPlus } from 'react-icons/fa';

const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulación de carga de datos
    setTimeout(() => {
      setTeams(mockTeamsData);
      setIsLoading(false);
    }, 500);
  }, []);

  const getRoleClass = (role) => {
    // COMENTARIO: Se mantiene la lógica del rol, pero los estilos de tamaño se aplican en el elemento.
    // El patrón de diseño indica: Texto en negrita con fondo gris claro y bordes suavemente redondeados.
    return 'bg-gray-200 text-gray-800 font-bold';
  };

  if (isLoading) {
    return <div className="p-6 text-center">Cargando equipos...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Mis Equipos</h1>
          <p className="text-sm text-gray-600">Equipos a los que perteneces o administras</p>
        </div>
        {/* COMENTARIO: Se estandariza el botón para asegurar una altura y alineación consistentes. */}
        <Link
          to="/equipos/crear"
          className="btn-primary mt-3 sm:mt-0 inline-flex items-center justify-center h-10 px-4 whitespace-nowrap"
        >
          <FaPlus className="mr-2" />
          <span>Crear Nuevo Equipo</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => (
          <div 
            key={team.id} 
            // COMENTARIO: Se usa flex-grow para que el botón siempre quede al final, sin importar el contenido.
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col"
          >
            <div className="p-6 flex-grow flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold text-gray-800 pr-2">{team.nombre}</h2>
                {/* COMENTARIO: Se ajusta el padding y tamaño de fuente del badge de rol. */}
                <span className={`text-xs px-2 py-1 rounded-md whitespace-nowrap ${getRoleClass(team.rol)}`}>
                  {team.rol}
                </span>
              </div>
              {/* COMENTARIO: Se ajusta la altura de la descripción y se maneja el texto que no cabe. */}
              <p className="text-sm text-gray-600 mb-4 flex-grow h-20 overflow-hidden text-ellipsis">
                {team.descripcion}
              </p>
              
              <div className="flex space-x-4 text-sm text-gray-500 border-t pt-4 mt-auto">
                <div className="flex items-center">
                  <FaUsers className="mr-2 text-gray-400" />
                  <span>{team.miembros_count} Miembros</span>
                </div>
                <div className="flex items-center">
                  <FaFolder className="mr-2 text-gray-400" />
                  <span>{team.proyectos_count} Proyectos</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t">
              {/* COMENTARIO: Se estandariza el botón de gestión. */}
              <button 
                onClick={() => navigate(`/equipos/${team.id}`)} 
                className="btn-secondary w-full text-sm h-10 inline-flex items-center justify-center"
              >
                Gestionar Equipo
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamList;