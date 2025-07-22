// src/pages/UserProfile/UserProfile.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx'; 
import { FaSave, FaTimes, FaCamera, FaKey, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

// --- Componente para el formulario de cambio de contraseña ---
const ChangePasswordForm = () => {
    const { updatePassword } = useAuth();
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        const newErrors = {};
        if (!passwords.currentPassword) newErrors.currentPassword = 'La contraseña actual es requerida.';
        if (!passwords.newPassword) {
            newErrors.newPassword = 'La nueva contraseña es requerida.';
        } else if (passwords.newPassword.length < 8) {
            newErrors.newPassword = 'La nueva contraseña debe tener al menos 8 caracteres.';
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await updatePassword(passwords.newPassword);
            setMessage({ type: 'success', text: '¡Contraseña actualizada exitosamente! Se ha enviado un email de confirmación.' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error("Error al actualizar contraseña:", error);
            setMessage({ type: 'error', text: error.message || 'Hubo un error al actualizar la contraseña.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-700 mb-6 border-t pt-6">Cambiar Contraseña</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                    <div className="relative">
                        <FaLock className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handleChange} className="input-field w-full pl-10" />
                    </div>
                    {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>}
                </div>
                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                    <div className="relative">
                        <FaLock className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <input type="password" name="newPassword" value={passwords.newPassword} onChange={handleChange} className="input-field w-full pl-10" />
                    </div>
                    {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                     <div className="relative">
                        <FaLock className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handleChange} className="input-field w-full pl-10" />
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                {message && (
                    <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}
                <div className="flex justify-end">
                    {/* COMENTARIO 1: Se ajustan las clases para asegurar altura y alineación correcta. */}
                    <button type="submit" className="btn-primary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap" disabled={isSubmitting}>
                        <FaKey className="mr-2" />
                        {isSubmitting ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </button>
                </div>
            </form>
        </div>
    );
};


const UserProfile = () => {
    const { user, profile: authProfile } = useAuth();
    const [profile, setProfile] = useState({ nombre_completo: '', avatar_url: null });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setIsLoading(true);
        if (authProfile) {
            setProfile(authProfile);
            setAvatarPreview(authProfile.avatar_url);
        }
        setIsLoading(false);
    }, [authProfile]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        alert('Perfil actualizado exitosamente (simulación).');
        setIsSaving(false);
        navigate('/dashboard');
    };
    
    if (isLoading) {
        return <div className="p-6">Cargando perfil...</div>
    }

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Editar Mi Perfil</h1>
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative">
                            <img 
                                src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.nombre_completo || user?.email?.charAt(0) || 'U')}&background=random`} 
                                alt="Avatar" 
                                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                            />
                            <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 shadow-md">
                                <FaCamera />
                                <input id="avatar-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                            <div className="relative">
                               <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    id="nombre_completo"
                                    name="nombre_completo"
                                    value={profile.nombre_completo || ''}
                                    onChange={handleChange}
                                    className="input-field w-full pl-10"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                             <div className="relative">
                                <FaEnvelope className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="input-field w-full pl-10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-4 border-t pt-6 mt-8">
                        {/* COMENTARIO 2: Se añaden las clases hover para el efecto rojo. */}
                        {/* COMENTARIO 1: Se ajustan las clases para asegurar altura y alineación. */}
                        <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap hover:bg-red-600 hover:border-red-700 hover:text-white transition-colors duration-200">
                           <FaTimes className="mr-2" /> Cancelar
                        </button>
                        <button type="submit" className="btn-primary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap" disabled={isSaving}>
                            <FaSave className="mr-2" />
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
                
                <ChangePasswordForm />
            </div>
        </div>
    );
};

export default UserProfile;