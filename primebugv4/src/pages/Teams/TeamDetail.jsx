// src/pages/Teams/TeamDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTeamById, addTeamMember, removeTeamMember, updateTeamMemberRole, deleteTeam } from '../../services/teams';
import { FaAngleDown, FaAngleUp, FaUsers, FaFolder, FaPlus, FaTrashAlt, FaEdit, FaUserPlus, FaTimes } from 'react-icons/fa';

const TeamDetail = () => {
  const { id: teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para secciones colapsables
  const [showDetails, setShowDetails] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [showProjects, setShowProjects] = useState(true);

  // Estados para la gestión de miembros
  const [isAdding, setIsAdding] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Miembro');

  const loadTeamData = async () => {
    setIsLoading(true);
    const response = await getTeamById(teamId);
    if (response.success) {
      setTeam(response.data.team);
      const memberIds = new Set(response.data.team.miembros.map(m => m.id));
      setAvailableUsers(response.data.allUsers.filter(u => !memberIds.has(u.id)));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  // --- Handlers ---

    const handleAddMember = async () => {
        if (!selectedUserId) return;
        const response = await addTeamMember(teamId, selectedUserId, selectedRole);
        if (response.success) {
            const newUser = availableUsers.find(u => u.id === selectedUserId);
            setTeam(prevTeam => ({ ...prevTeam, miembros: [...prevTeam.miembros, { ...newUser, rol: selectedRole }] }));
            setAvailableUsers(prev => prev.filter(u => u.id !== selectedUserId));
            setSelectedUserId('');
            alert(`Usuario ${newUser.nombre_completo} añadido al equipo.`);
        }
    };

    const handleRemoveMember = async (userId, userName) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar a ${userName} del equipo?`)) {
            const response = await removeTeamMember(teamId, userId);
            if (response.success) {
                const removedUser = team.miembros.find(m => m.id === userId);
                setTeam(prevTeam => ({ ...prevTeam, miembros: prevTeam.miembros.filter(m => m.id !== userId) }));
                setAvailableUsers(prev => [...prev, removedUser]);
                alert(`Usuario ${userName} eliminado del equipo.`);
            }
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        const response = await updateTeamMemberRole(teamId, userId, newRole);
        if (response.success) {
            setTeam(prevTeam => ({ ...prevTeam, miembros: prevTeam.miembros.map(m => m.id === userId ? { ...m, rol: newRole } : m) }));
            alert(`Rol actualizado a ${newRole}.`);
        }
    };

  const handleEditTeam = () => {
    navigate(`/equipos/editar/${teamId}`);
  };

  // --- COMENTARIO: Handler de eliminación con validación de integridad ---
  const handleDeleteTeam = async () => {
    if (!team) return;
    
    // 1. Verificamos si hay proyectos activos asociados al equipo.
    // (Asumimos que el servicio getTeamById devuelve un array `team.proyectos`)
    const activeProjects = team.proyectos ? team.proyectos.filter(p => p.status === 'Activo') : [];

    if (activeProjects.length > 0) {
      // 2. Si hay proyectos activos, se muestra un error y se detiene la ejecución.
      const projectNames = activeProjects.map(p => p.name).join(', ');
      alert(`No se puede eliminar el equipo "${team.nombre}" porque está asociado a proyectos activos: ${projectNames}.\n\nPor favor, cierra o reasigna estos proyectos primero.`);
      return; 
    }
    
    // 3. Si no hay proyectos activos, se procede con la confirmación.
    if (window.confirm(`¿Estás seguro de que quieres eliminar el equipo "${team.nombre}"? Esta acción no se puede deshacer.`)) {
      // En un caso real, llamaríamos al servicio de borrado.
      // const response = await deleteTeam(teamId);
      // if (response.success) { ... }
      console.log(`MOCK: Eliminando equipo con ID ${teamId}`);
      alert(`Equipo "${team.nombre}" eliminado exitosamente (Simulación).`);
      navigate('/equipos');
    }
  };


  // --- Componentes de UI para legibilidad ---
  const Card = ({ children }) => <div className="bg-white shadow-lg rounded-lg overflow-hidden">{children}</div>;
  const CardHeader = ({ title, icon, action, onActionClick, children }) => (
    <div className="p-4 px-6 border-b flex justify-between items-center bg-gray-50">
      <h2 className="text-lg font-bold text-gray-800 flex items-center">{icon}{title}</h2>
      {action && (
        <button onClick={onActionClick} className={`btn-secondary inline-flex items-center justify-center text-sm h-9 px-3 ${isAdding ? 'hover:bg-red-600 hover:border-red-700 hover:text-white' : ''}`}>
          {isAdding ? <FaTimes className="mr-2" /> : <FaUserPlus className="mr-2" />}
          {action}
        </button>
      )}
      {children}
    </div>
  );
  const CardContent = ({ children, className = '' }) => <div className={`p-6 ${className}`}>{children}</div>;


  if (isLoading) return <div className="p-6 text-center">Cargando detalles del equipo...</div>;
  if (!team) return <div className="p-6 text-center text-red-500">No se encontró el equipo.</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{team.nombre}</h1>
          <p className="text-gray-500 mt-1">Gestiona los detalles, miembros y proyectos de tu equipo.</p>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={handleEditTeam} className="btn-secondary inline-flex items-center h-10 px-4"><FaEdit className="mr-2" /> Editar Equipo</button>
            <button onClick={handleDeleteTeam} className="btn-danger inline-flex items-center h-10 px-4"><FaTrashAlt className="mr-2" /> Eliminar Equipo</button>
        </div>
      </div>
      
      <Card>
        <CardHeader 
          icon={<FaUsers className="mr-3 text-gray-400" />} 
          title={`Miembros (${team.miembros.length})`}
          action={isAdding ? 'Cancelar' : 'Añadir Miembro'}
          onActionClick={() => setIsAdding(!isAdding)}
        />
        
        {isAdding && (
          <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row items-center gap-2">
              <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="input-field w-full sm:flex-grow">
                  <option value="">Seleccionar usuario...</option>
                  {availableUsers.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
              </select>
              <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="input-field w-full sm:w-auto">
                  <option value="Miembro">Miembro</option>
                  <option value="Administrador">Administrador</option>
              </select>
              <button onClick={handleAddMember} disabled={!selectedUserId} className="btn-primary w-full sm:w-auto inline-flex items-center justify-center h-10 px-4 whitespace-nowrap">
                <FaUserPlus className="mr-2" />Añadir
              </button>
          </div>
        )}

        <ul className="divide-y divide-gray-200">
          {team.miembros.map(member => (
            <li key={member.id} className="p-4 px-6 flex flex-col sm:flex-row justify-between sm:items-center hover:bg-gray-50 transition-colors duration-150 gap-4">
              <div className="flex items-center">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.nombre_completo)}&background=random&color=fff`} alt={member.nombre_completo} className="w-10 h-10 rounded-full mr-4" />
                <div>
                  <p className="font-semibold text-gray-900">{member.nombre_completo}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 self-end sm:self-center">
                  <select 
                    value={member.rol} 
                    onChange={e => handleRoleChange(member.id, e.target.value)}
                    className="bg-gray-200 border-gray-200 text-gray-800 font-bold rounded-md text-xs px-2 h-7 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  >
                      <option value="Miembro">Miembro</option>
                      <option value="Administrador">Administrador</option>
                  </select>
                  <button onClick={() => handleRemoveMember(member.id, member.nombre_completo)} className="text-gray-400 hover:text-red-600 transition-colors duration-150">
                      <FaTrashAlt />
                  </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default TeamDetail;