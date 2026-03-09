import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getProjectsByTeam } from '../../services/projects';
import { useNavigate } from 'react-router-dom';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, updateDoc, deleteField } from 'firebase/firestore'; 
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; 
import { db, auth, storage } from '../../firebase';

// IMPORTAMOS EL COMPRESOR DE IMÁGENES
import imageCompression from 'browser-image-compression';

import { UI } from '../../utils/design';
import { 
    FaUser, FaLock, FaCamera, FaSave, FaSpinner, 
    FaEnvelope, FaCheckCircle, FaExclamationCircle, FaTrashAlt,
    FaQuestionCircle
} from 'react-icons/fa';

const MAX_NAME_LENGTH = 30;

const UserProfile = () => {
    const { user, refreshUser, currentTeam } = useAuth();
    const navigate = useNavigate();
    
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [currentPhoto, setCurrentPhoto] = useState(user?.photoURL || null);
    
    const [loading, setLoading] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setCurrentPhoto(user.photoURL || null);
        }
    }, [user]);

    const initials = useMemo(() => {
        if (displayName) {
            const names = displayName.trim().split(' ');
            if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
            return names[0].substring(0, 2).toUpperCase();
        }
        if (user?.email) return user.email.substring(0, 2).toUpperCase();
        return 'US';
    }, [displayName, user?.email]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (displayName.length > MAX_NAME_LENGTH) {
            setMsg({ type: 'error', text: `El nombre no puede exceder los ${MAX_NAME_LENGTH} caracteres.` });
            return;
        }
        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            await updateProfile(auth.currentUser, { displayName: displayName });
            const userRef = doc(db, "profiles", user.uid);
            await updateDoc(userRef, { nombre_completo: displayName, updated_at: new Date() }).catch(() => {});
            await refreshUser(); 
            setMsg({ type: 'success', text: 'Perfil actualizado correctamente.' });
        } catch (error) {
            setMsg({ type: 'error', text: 'Error al actualizar el perfil.' });
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DE COMPRESIÓN IMPLEMENTADA AQUÍ ---
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setMsg({ type: 'error', text: 'El archivo debe ser una imagen.' });
            return;
        }
        
        // Aumentamos el límite de entrada a 5MB (ya que lo vamos a comprimir)
        if (file.size > 5 * 1024 * 1024) { 
            setMsg({ type: 'error', text: 'La imagen original no puede pesar más de 5MB.' });
            return;
        }
        
        setPhotoLoading(true);
        setMsg({ type: '', text: '' });

        try {
            // Opciones de compresión agresiva pero sin perder calidad visual
            const options = {
                maxSizeMB: 0.5, // La reducimos a máximo 500KB
                maxWidthOrHeight: 1024, // 1024px es más que suficiente para un avatar
                useWebWorker: true // Usa un hilo secundario para no congelar la UI
            };

            // 1. Comprimimos la imagen
            const compressedFile = await imageCompression(file, options);

            // 2. Subimos el archivo COMPRIMIDO a Firebase
            const storageRef = ref(storage, `profile_photos/${user.uid}`);
            await uploadBytes(storageRef, compressedFile);
            const photoURL = await getDownloadURL(storageRef);

            // 3. Actualizamos los perfiles
            await updateProfile(auth.currentUser, { photoURL });
            const userRef = doc(db, "profiles", user.uid);
            await updateDoc(userRef, { photoURL: photoURL, updated_at: new Date() }).catch(() => {});
            
            setCurrentPhoto(photoURL);
            await refreshUser();
            setMsg({ type: 'success', text: 'Foto actualizada y optimizada.' });
        } catch (error) {
            console.error(error);
            setMsg({ type: 'error', text: 'Error al procesar o subir la imagen.' });
        } finally {
            setPhotoLoading(false);
        }
    };

    const handleDeletePhoto = async () => {
        if (!window.confirm("¿Quieres eliminar tu foto de perfil y volver a las iniciales?")) return;
        setPhotoLoading(true);
        setMsg({ type: '', text: '' });

        try {
            const storageRef = ref(storage, `profile_photos/${user.uid}`);
            try { await deleteObject(storageRef); } catch (err) {}

            await updateProfile(auth.currentUser, { photoURL: "" });
            const userRef = doc(db, "profiles", user.uid);
            await updateDoc(userRef, { photoURL: deleteField(), updated_at: new Date() });

            setCurrentPhoto(null);
            await refreshUser();
            setMsg({ type: 'success', text: 'Foto eliminada.' });
        } catch (error) {
            setMsg({ type: 'error', text: 'Error al eliminar la foto.' });
        } finally {
            setPhotoLoading(false);
        }
    };

    const triggerFileInput = () => fileInputRef.current.click();

    const handleResetPassword = async () => {
        if (!user.email) return;
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, user.email);
            setMsg({ type: 'success', text: `Se ha enviado un correo a ${user.email} para restablecer tu contraseña.` });
        } catch (error) {
            setMsg({ type: 'error', text: 'No se pudo enviar el correo. Intenta más tarde.' });
        } finally {
            setLoading(false);
        }
    };

    const handleRestartTour = async () => {
        if (!currentTeam) {
            setMsg({ type: 'error', text: 'Debes pertenecer a un equipo para iniciar el tutorial.' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setLoading(true);
        setMsg({ type: '', text: '' }); 

        try {
            const res = await getProjectsByTeam(currentTeam.id, user.uid);
            if (!res.success || !res.data || res.data.length === 0) {
                setMsg({ 
                    type: 'error', 
                    text: 'Debes tener al menos un proyecto activo en tu equipo para realizar el recorrido guiado.' 
                });
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setLoading(false);
                return;
            }

            if (!window.confirm("¿Deseas reiniciar el tutorial interactivo? Te llevaremos a la pantalla de inicio.")) {
                setLoading(false);
                return;
            }
            
            const userRef = doc(db, "profiles", user.uid);
            await updateDoc(userRef, { has_seen_onboarding: false });
            
            window.dispatchEvent(new Event('restartOnboardingTour'));
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            setMsg({ type: 'error', text: 'Error al reiniciar el tutorial.' });
            setLoading(false);
        }
    };

    return (
        <div className={UI.PAGE_CONTAINER}>
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="mb-6">
                    <h1 className={UI.HEADER_TITLE}>Mi Perfil</h1>
                    <p className={UI.HEADER_SUBTITLE}>Gestiona tu identidad y seguridad.</p>
                </div>

                {msg.text && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-fade-in ${
                        msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {msg.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                        {msg.text}
                    </div>
                )}

                <div className={`${UI.CARD_BASE} p-8`}>
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                        <FaUser className="text-indigo-600"/>
                        <h2 className="font-bold text-slate-800 text-lg">Información Pública</h2>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex flex-col items-center gap-3 w-full md:w-auto">
                            <div className="relative group">
                                <div 
                                    className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-slate-400 overflow-hidden relative cursor-pointer"
                                    onClick={triggerFileInput}
                                >
                                    {photoLoading ? (
                                        <FaSpinner className="animate-spin text-indigo-500" />
                                    ) : currentPhoto ? (
                                        <img src={currentPhoto} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-slate-500">{initials}</span>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <FaCamera className="text-white text-xl" />
                                    </div>
                                </div>
                                {currentPhoto && !photoLoading && (
                                    <button onClick={handleDeletePhoto} className="absolute bottom-0 right-0 bg-red-100 text-red-600 p-2 rounded-full border-2 border-white shadow-md hover:bg-red-200 transition-colors z-10" title="Eliminar foto">
                                        <FaTrashAlt size={12} />
                                    </button>
                                )}
                            </div>
                            <button type="button" onClick={triggerFileInput} className="text-xs font-bold text-indigo-600 hover:underline" disabled={photoLoading}>
                                {photoLoading ? 'Procesando...' : 'Cambiar foto'}
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>

                        <form onSubmit={handleUpdateProfile} className="flex-1 w-full space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider text-[10px]">Nombre de Usuario</label>
                                    <span className={`text-[10px] font-bold ${displayName.length === MAX_NAME_LENGTH ? 'text-red-500' : 'text-slate-400'}`}>
                                        {displayName.length}/{MAX_NAME_LENGTH}
                                    </span>
                                </div>
                                <input type="text" className={UI.INPUT_TEXT} value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={MAX_NAME_LENGTH} />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={loading || displayName.length === 0} className={`${UI.BTN_PRIMARY} px-6`}>
                                    {loading ? <FaSpinner className="animate-spin" /> : <><FaSave /> Guardar Cambios</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className={`${UI.CARD_BASE} p-8 border-l-4 border-l-orange-400`}>
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                        <FaLock className="text-orange-500"/>
                        <h2 className="font-bold text-slate-800 text-lg">Seguridad</h2>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-1">
                            <h3 className="font-bold text-slate-700">Contraseña</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <FaEnvelope className="text-slate-400"/>
                                <span>Asociada al correo: <strong>{user?.email}</strong></span>
                            </div>
                        </div>
                        <button type="button" onClick={handleResetPassword} disabled={loading} className="w-full md:w-auto bg-white border border-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl hover:bg-slate-50 hover:text-orange-600 transition-colors shadow-sm whitespace-nowrap">
                            Enviar correo de recuperación
                        </button>
                    </div>
                </div>

                <div className={`${UI.CARD_BASE} p-8 border-l-4 border-l-blue-400`}>
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                        <FaQuestionCircle className="text-blue-500"/>
                        <h2 className="font-bold text-slate-800 text-lg">Ayuda y Preferencias</h2>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-1">
                            <h3 className="font-bold text-slate-700">Tutorial de Bienvenida</h3>
                            <p className="text-sm text-slate-500 mt-1 max-w-md">
                                Si ha pasado un tiempo sin conectarte y no recuerdas cómo utilizar PrimeBug, puedes volver a activar el recorrido guiado por la plataforma.
                            </p>
                        </div>
                        <button type="button" onClick={handleRestartTour} disabled={loading} className="w-full md:w-auto bg-blue-50 border border-blue-200 text-blue-700 font-bold py-2.5 px-4 rounded-xl hover:bg-blue-100 transition-colors shadow-sm whitespace-nowrap flex justify-center">
                            {loading ? <FaSpinner className="animate-spin" /> : 'Reiniciar Tutorial'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;