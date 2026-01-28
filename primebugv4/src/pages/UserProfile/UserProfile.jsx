// src/pages/UserProfile/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx'; 
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaSave, FaTimes, FaCamera, FaKey, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

// --- Componente para el formulario de cambio de contraseña ---
const ChangePasswordForm = () => {
    const { updatePassword } = useAuth();
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        const newErrors = {};
        if (!passwords.newPassword) {
            newErrors.newPassword = 'La nueva contraseña es requerida.';
        } else if (passwords.newPassword.length < 8) {
            newErrors.newPassword = 'Debe tener al menos 8 caracteres.';
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
        setMessage(null);
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await updatePassword(passwords.newPassword);
            setMessage({ type: 'success', text: '¡Contraseña actualizada! Por seguridad, usa tu nueva clave en el próximo inicio.' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error("Error al actualizar contraseña:", error);
            setMessage({ type: 'error', text: 'Error: Re-autenticación requerida para cambios sensibles.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-700 mb-6 border-t pt-6">Seguridad de la Cuenta</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                    <div className="relative">
                        <FaLock className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <input type="password" name="newPassword" value={passwords.newPassword} onChange={handleChange} className="input-field w-full pl-10 border-gray-300 rounded-md shadow-sm" />
                    </div>
                    {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                    <div className="relative">
                        <FaLock className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handleChange} className="input-field w-full pl-10 border-gray-300 rounded-md shadow-sm" />
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                {message && (
                    <div className={`p-3 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {message.text}
                    </div>
                )}
                <div className="flex justify-end">
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center shadow-md shadow-indigo-100" disabled={isSubmitting}>
                        <FaKey className="mr-2" />
                        {isSubmitting ? 'Procesando...' : 'Cambiar Clave'}
                    </button>
                </div>
            </form>
        </div>
    );
};


const UserProfile = () => {
    const { user, profile: authProfile, refreshProfile } = useAuth();
    const [profile, setProfile] = useState({ nombre_completo: '', avatar_url: null });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (authProfile) {
            setProfile(authProfile);
            setAvatarPreview(authProfile.avatar_url);
            setIsLoading(false);
        }
    }, [authProfile]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            alert("Sugerencia: Para subir imágenes reales, debemos configurar Firebase Storage.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        
        setIsSaving(true);
        try {
            // Actualizamos solo los datos de Firestore en la colección profiles
            const profileRef = doc(db, "profiles", user.uid);
            await updateDoc(profileRef, {
                nombre_completo: profile.nombre_completo,
                // Si tuviéramos Firebase Storage, aquí iría la URL de la imagen
                actualizado_en: new Date().toISOString()
            });

            // Refrescamos el contexto para que toda la app vea el nuevo nombre
            await refreshProfile(user.uid);
            
            alert('Perfil actualizado correctamente en la nube.');
            navigate('/dashboard');
        } catch (error) {
            console.error("Error al actualizar perfil:", error);
            alert("Hubo un error al guardar los cambios.");
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 animate-fade-in">
            <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight text-center sm:text-left">Mi Perfil</h1>
            
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col items-center mb-10">
                        <div className="relative group">
                            <img 
                                src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.nombre_completo || 'U')}&background=6366f1&color=fff&size=128`} 
                                alt="Avatar" 
                                className="w-32 h-32 rounded-full object-cover border-4 border-indigo-50 shadow-inner"
                            />
                            <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-indigo-700 shadow-lg transition-transform group-hover:scale-110">
                                <FaCamera />
                                <input id="avatar-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                        </div>
                        <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Identidad de Usuario</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="nombre_completo" className="block text-xs font-black text-gray-500 uppercase mb-2 tracking-wider">Nombre Completo</label>
                            <div className="relative">
                                <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    id="nombre_completo"
                                    name="nombre_completo"
                                    value={profile.nombre_completo || ''}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                    placeholder="Tu nombre profesional"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-xs font-black text-gray-500 uppercase mb-2 tracking-wider">Correo Vinculado (No editable)</label>
                             <div className="relative">
                                <FaEnvelope className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-300" />
                                <input
                                    type="email"
                                    id="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 font-medium cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 border-t border-gray-50 pt-8 mt-10">
                        <button 
                            type="button" 
                            onClick={() => navigate('/dashboard')} 
                            className="px-6 py-2.5 rounded-xl text-gray-500 font-bold hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:bg-gray-300 transition-all flex items-center"
                        >
                            <FaSave className="mr-2" />
                            {isSaving ? 'Guardando...' : 'Actualizar Perfil'}
                        </button>
                    </div>
                </form>
                
                <ChangePasswordForm />
            </div>
        </div>
    );
};

export default UserProfile;