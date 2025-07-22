// src/pages/Projects/ProjectMembers.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectMembers } from '../../services/useProjectMembers';
import ConfirmationModal from '../../utils/ConfirmationModal';
// COMENTARIO: Se importan los íconos necesarios para los nuevos estilos.
import { FaTrashAlt, FaPlus, FaSearch, FaTimes, FaUser, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';

// --- COMENTARIO: Componente InviteModal con Estilos Aplicados ---
const InviteModal = ({ isOpen, onClose, users, onInvite }) => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState('Developer'); // Rol por defecto
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
                    <div>
                        <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">Usuario a invitar</label>
                        <div className="relative">
                            <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                            <select id="user-select" className="input-field w-full pl-10" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                                <option value="">Selecciona un usuario...</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-1">Asignar Rol</label>
                        <div className="relative">
                            <FaShieldAlt className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                            <select id="role-select" className="input-field w-full pl-10" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                                <option value="Manager">Manager</option>
                                <option value="Developer">Developer</option>
                                <option value="Tester">Tester</option>
                                <option value="Viewer">Viewer</option>
                            </select>
                        </div>
                    </div>
                </div>
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


const ProjectMembers = () => {
    const { projectId } = useParams();
    const { project, members, loading, error, availableUsers, selectedUserId, setSelectedUserId, addMember, updateMemberRole, removeMember } = useProjectMembers(projectId);
    const [memberToRemove, setMemberToRemove] = useState(null);

    // COMENTARIO: Se estandariza el estilo de los roles.
    const getRoleClass = (role) => {
        return 'bg-gray-200 text-gray-800 font-bold';
    };

    if (loading) return <div className="p-6 text-center">Cargando miembros del proyecto...</div>;
    if (error) return <p className="p-6 text-center text-red-500">Error: {error}</p>;

    return (
        <>
            <ConfirmationModal
                isOpen={!!memberToRemove}
                title="Confirmar Eliminación"
                message={`¿Estás seguro de que quieres eliminar a ${memberToRemove?.name} del proyecto?`}
                onConfirm={() => {
                    removeMember(memberToRemove.id);
                    setMemberToRemove(null);
                }}
                onCancel={() => setMemberToRemove(null)}
            />
            <div className="container mx-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                            Miembros del Proyecto
                        </h1>
                        <p className="text-gray-600">{project?.name}</p>
                    </div>
                    {/* COMENTARIO: Se estandariza el botón "Volver". */}
                    <Link to={`/proyectos/${project?.id || projectId}`} className="btn-secondary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap mt-3 sm:mt-0 hover:bg-gray-200">
                        <FaArrowLeft className="mr-2" />
                        Volver al Proyecto
                    </Link>
                </div>

                {/* COMENTARIO: Se agrupan "Añadir Miembro" y la tabla en una sola tarjeta. */}
                <div className="bg-white rounded-lg shadow-lg">
                    {/* --- Formulario para añadir miembro --- */}
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">Añadir Nuevo Miembro</h2>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="input-field w-full sm:flex-grow"
                                disabled={availableUsers.length === 0}
                            >
                                <option value="">{availableUsers.length > 0 ? 'Selecciona un miembro para añadir' : 'No hay usuarios disponibles'}</option>
                                {availableUsers.map(user => (
                                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                ))}
                            </select>
                            <button onClick={addMember} className="btn-primary w-full sm:w-auto inline-flex items-center justify-center h-10 px-4 whitespace-nowrap" disabled={!selectedUserId}>
                                <FaPlus className="mr-2" />
                                Añadir
                            </button>
                        </div>
                    </div>

                    {/* --- Tabla de Miembros Actuales --- */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rol</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha de Unión</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {members.map(member => (
                                    <tr key={member.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="font-medium text-gray-900">{member.name}</div>
                                                <div className="text-sm text-gray-500 ml-2">({member.email})</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {/* COMENTARIO: Se estandariza el dropdown de Rol para que parezca un badge. */}
                                            <select
                                                value={member.role}
                                                onChange={(e) => updateMemberRole(member.id, e.target.value)}
                                                className="bg-gray-200 border-gray-200 text-gray-800 font-bold rounded-md text-xs px-2 h-7 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                            >
                                                <option value="Manager">Manager</option>
                                                <option value="Developer">Developer</option>
                                                <option value="Tester">Tester</option>
                                                <option value="Viewer">Viewer</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.join_date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex justify-center">
                                                {/* COMENTARIO: Botón de eliminar estandarizado. */}
                                                <button onClick={() => setMemberToRemove(member)} className="text-gray-400 hover:text-red-600 hover:bg-red-100 p-2 rounded-full transition-colors">
                                                    <FaTrashAlt />
                                                </button>
                                            </div>
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

export default ProjectMembers;