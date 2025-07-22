// src/pages/Members/MemberList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllUsers, inviteUser } from '../../services/users';
// COMENTARIO: Se añaden los íconos necesarios para los nuevos estilos.
import { FaPlus, FaSearch, FaTimes, FaIdCard, FaUser, FaShieldAlt } from 'react-icons/fa';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

// --- Componente InviteModal con Estilos Aplicados ---
const InviteModal = ({ isOpen, onClose, users, onInvite }) => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState('Miembro');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!selectedUserId) {
            alert('Por favor, selecciona un usuario.');
            return;
        }
        setIsSubmitting(true);
        await onInvite(selectedUserId, selectedRole);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center border-b pb-3 mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Invitar Nuevo Miembro</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 p-1 rounded-full transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>
                <div className="space-y-6">
                    {/* COMENTARIO: Se añaden íconos a los campos de selección. */}
                    <div>
                        <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">Usuario a invitar</label>
                        <div className="relative">
                            <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                            <select
                                id="user-select"
                                className="input-field w-full pl-10"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                            >
                                <option value="">Selecciona un usuario...</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.nombre_completo} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-1">Asignar Rol</label>
                        <div className="relative">
                            <FaShieldAlt className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                            <select
                                id="role-select"
                                className="input-field w-full pl-10"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                <option value="Miembro">Miembro</option>
                                <option value="Administrador">Administrador</option>
                            </select>
                        </div>
                    </div>
                </div>
                {/* COMENTARIO: Se estandarizan los botones del modal. */}
                <div className="flex justify-end space-x-4 pt-6 mt-6 border-t">
                    <button onClick={onClose} className="btn-secondary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap hover:bg-red-600 hover:border-red-700 hover:text-white transition-colors duration-200">
                        <FaTimes className="mr-2" /> Cancelar
                    </button>
                    <button onClick={handleSubmit} className="btn-primary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap" disabled={isSubmitting || !selectedUserId}>
                        {isSubmitting ? 'Enviando...' : 'Enviar Invitación'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const MemberList = () => {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      const response = await fetchAllUsers();
      if (response.success) {
        setMembers(response.data);
      }
      setIsLoading(false);
    };
    loadUsers();
  }, []);

  const handleInvite = async (userId, role) => {
    const response = await inviteUser(userId, role);
    if (response.success) {
        const invitedUser = members.find(m => m.id === userId);
        alert(`Invitación enviada a ${invitedUser.nombre_completo} con el rol de ${role} (simulación).`);
    } else {
        alert('Ocurrió un error al enviar la invitación.');
    }
  };

  const filteredMembers = members.filter(member =>
    member.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // COMENTARIO: Se ajusta la clase del rol para seguir el patrón de diseño.
  const getRoleClass = (role) => {
    // Texto en negrita con fondo gris claro y bordes suavemente redondeados.
    return 'bg-gray-200 text-gray-800 font-bold';
  };

  if (isLoading) {
    return <div className="p-6 text-center">Cargando miembros...</div>;
  }

  return (
    <>
      <InviteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        users={members}
        onInvite={handleInvite}
      />
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Gestión de Miembros</h1>
            <p className="text-sm text-gray-600">Directorio de todos los usuarios en la organización</p>
          </div>
          {/* COMENTARIO: Se estandariza el botón principal de la página. */}
          <button onClick={() => setIsModalOpen(true)} className="btn-primary mt-3 sm:mt-0 inline-flex items-center justify-center h-10 px-4 whitespace-nowrap">
            <FaPlus className="mr-2" />
            <span>Invitar Nuevo Miembro</span>
          </button>
        </div>

        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Buscar miembros por nombre o email..."
            className="input-field pl-10 w-full md:w-1/3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rol</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha de Unión</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 font-semibold whitespace-no-wrap">{member.nombre_completo}</p>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-600 whitespace-no-wrap">{member.email}</p>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                        {/* COMENTARIO: Se ajusta el padding y tamaño de fuente del badge de rol. */}
                        <span className={`text-xs px-2.5 py-1 rounded-md ${getRoleClass(member.rol)}`}>
                            {member.rol}
                        </span>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                        <p className="text-gray-600 whitespace-no-wrap">{member.fecha_union}</p>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                        <Tippy content="Ver Perfil">
                            <button 
                                onClick={() => navigate('/perfil')} // Debería navegar a /perfil/member.id en un futuro
                                className="text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <FaIdCard className="h-5 w-5" />
                            </button>
                        </Tippy>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberList;