// src/pages/Members/MemberList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { FaPlus, FaSearch, FaTimes, FaIdCard, FaUser, FaShieldAlt } from 'react-icons/fa';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

// --- Componente InviteModal ---
const InviteModal = ({ isOpen, onClose, users, onInvite }) => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState('Miembro');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!selectedUserId) return;
        setIsSubmitting(true);
        await onInvite(selectedUserId, selectedRole);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md animate-fade-in-up">
                <div className="flex justify-between items-center border-b pb-3 mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Gestionar Rol de Miembro</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Seleccionar Usuario</label>
                        <div className="relative">
                            <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                            <select
                                className="input-field w-full pl-10 border-gray-300 rounded-md focus:ring-indigo-500"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                            >
                                <option value="">Selecciona un usuario...</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.nombre_completo}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Asignar Rol</label>
                        <div className="relative">
                            <FaShieldAlt className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                            <select
                                className="input-field w-full pl-10 border-gray-300 rounded-md focus:ring-indigo-500"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                <option value="Miembro">Miembro</option>
                                <option value="Administrador">Administrador</option>
                                <option value="Developer">Developer</option>
                                <option value="QA">QA</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-bold hover:bg-indigo-700 disabled:bg-indigo-300"
                        disabled={isSubmitting || !selectedUserId}
                    >
                        {isSubmitting ? 'Actualizando...' : 'Confirmar Cambios'}
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

  // 1. Cargar Miembros desde Firestore en tiempo real
  useEffect(() => {
    const q = query(collection(db, "profiles"), orderBy("nombre_completo", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(usersData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Actualizar Rol (Simulando invitación)
  const handleInvite = async (userId, role) => {
    try {
        const userRef = doc(db, "profiles", userId);
        await updateDoc(userRef, { rol: role });
        // No hace falta alert, el onSnapshot actualizará la UI solo
    } catch (error) {
        alert('Error al actualizar el miembro: ' + error.message);
    }
  };

  const filteredMembers = members.filter(member =>
    member.nombre_completo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="p-10 text-center animate-pulse text-indigo-600 font-bold">Cargando directorio de miembros...</div>;

  return (
    <>
      <InviteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        users={members}
        onInvite={handleInvite}
      />
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Equipo</h1>
            <p className="text-gray-500">Gestiona los roles y permisos de tu organización</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="btn-primary mt-4 sm:mt-0 flex items-center bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition-all"
          >
            <FaPlus className="mr-2" /> Gestionar Roles
          </button>
        </div>

        <div className="mb-6 relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Rol</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Unido el</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Perfil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3">
                            {member.nombre_completo?.[0]}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-900">{member.nombre_completo}</div>
                            <div className="text-xs text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-extrabold ${
                          member.rol === 'Administrador' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {member.rol || 'Miembro'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'Pendiente'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Tippy content="Ver detalles">
                        <button 
                            onClick={() => navigate(`/perfil/${member.id}`)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors p-2"
                        >
                          <FaIdCard size={18} />
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