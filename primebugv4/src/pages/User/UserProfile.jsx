import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, updateDoc, deleteField } from 'firebase/firestore'; // Agregado deleteField
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Agregado deleteObject
import { db, auth, storage } from '../../firebase';

// --- DESIGN SYSTEM ---
import { UI } from '../../utils/design';
import { 
    FaUser, FaLock, FaCamera, FaSave, FaSpinner, 
    FaEnvelope, FaCheckCircle, FaExclamationCircle, FaTrashAlt 
} from 'react-icons/fa';

const MAX_NAME_LENGTH = 30;

const UserProfile = () => {
    const { user } = useAuth();
    
    // Estados
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [loading, setLoading] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    
    const fileInputRef = useRef(null);

    // Sincronizar nombre inicial
    useEffect(() => {
        if (user?.displayName) setDisplayName(user.displayName);
    }, [user]);

    // --- HELPER: OBTENER INICIALES ---
    const getInitials = () => {
        if (displayName) {
            const names = displayName.trim().split(' ');
            if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
            return names[0].substring(0, 2).toUpperCase();
        }
        if (user?.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return 'US';
    };

    // --- ACCIÓN: ACTUALIZAR PERFIL (NOMBRE) ---
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        
        if (displayName.length > MAX_NAME_LENGTH) {
            setMsg({ type: 'error', text: `El nombre no puede exceder los ${MAX_NAME_LENGTH} caracteres.` });
            return;
        }

        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            // 1. Actualizar en Firebase Auth
            await updateProfile(auth.currentUser, {
                displayName: displayName
            });

            // 2. Actualizar en Firestore
            const userRef = doc(db, "profiles", user.uid);
            await updateDoc(userRef, {
                nombre_completo: displayName,
                updated_at: new Date()
            }).catch(async () => {
                console.warn("Perfil en Firestore no existía.");
            });

            setMsg({ type: 'success', text: 'Perfil actualizado correctamente.' });
            // Recargamos para que el nombre se actualice en el Sidebar si cambió
            setTimeout(() => window.location.reload(), 1000);
            
        } catch (error) {
            console.error(error);
            setMsg({ type: 'error', text: 'Error al actualizar el perfil.' });
            setLoading(false);
        }
    };

    // --- ACCIÓN: SUBIR FOTO ---
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validaciones básicas
        if (!file.type.startsWith('image/')) {
            setMsg({ type: 'error', text: 'El archivo debe ser una imagen.' });
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB
            setMsg({ type: 'error', text: 'La imagen no puede pesar más de 2MB.' });
            return;
        }

        setPhotoLoading(true);
        setMsg({ type: '', text: '' });

        try {
            // 1. Subir a Storage
            const storageRef = ref(storage, `profile_photos/${user.uid}`);
            await uploadBytes(storageRef, file);
            const photoURL = await getDownloadURL(storageRef);

            // 2. Actualizar Auth
            await updateProfile(auth.currentUser, { photoURL });

            // 3. Actualizar Firestore
            const userRef = doc(db, "profiles", user.uid);
            await updateDoc(userRef, { 
                photoURL: photoURL,
                updated_at: new Date()
            }).catch(() => console.warn("Doc no existe"));

            // 4. Refresco Global
            window.location.reload(); 

        } catch (error) {
            console.error("Error subiendo foto:", error);
            setMsg({ type: 'error', text: 'Error al subir la imagen.' });
            setPhotoLoading(false);
        }
    };

    // --- ACCIÓN: ELIMINAR FOTO ---
    const handleDeletePhoto = async () => {
        if (!window.confirm("¿Quieres eliminar tu foto de perfil y volver a las iniciales?")) return;

        setPhotoLoading(true);
        setMsg({ type: '', text: '' });

        try {
            // 1. Eliminar archivo de Storage (try/catch por si no existe el archivo físico)
            const storageRef = ref(storage, `profile_photos/${user.uid}`);
            try {
                await deleteObject(storageRef);
            } catch (err) {
                console.warn("No se encontró archivo en storage, continuando limpieza...");
            }

            // 2. Limpiar Auth (photoURL = null)
            await updateProfile(auth.currentUser, { photoURL: "" });

            // 3. Limpiar Firestore (borrar campo)
            const userRef = doc(db, "profiles", user.uid);
            await updateDoc(userRef, { 
                photoURL: deleteField(),
                updated_at: new Date()
            });

            // 4. Refresco Global para mostrar iniciales
            window.location.reload();

        } catch (error) {
            console.error("Error eliminando foto:", error);
            setMsg({ type: 'error', text: 'Error al eliminar la foto.' });
            setPhotoLoading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    // --- ACCIÓN: RECUPERAR CONTRASEÑA ---
    const handleResetPassword = async () => {
        if (!user.email) return;
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, user.email);
            setMsg({ type: 'success', text: `Se ha enviado un correo a ${user.email} para restablecer tu contraseña.` });
        } catch (error) {
            console.error(error);
            setMsg({ type: 'error', text: 'No se pudo enviar el correo. Intenta más tarde.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={UI.PAGE_CONTAINER}>
            
            <div className="max-w-3xl mx-auto space-y-8">
                
                {/* Header Simple */}
                <div className="mb-6">
                    <h1 className={UI.HEADER_TITLE}>Mi Perfil</h1>
                    <p className={UI.HEADER_SUBTITLE}>Gestiona tu identidad y seguridad.</p>
                </div>

                {/* MENSAJES DE ESTADO */}
                {msg.text && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
                        msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {msg.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                        {msg.text}
                    </div>
                )}

                {/* --- TARJETA 1: IDENTIDAD --- */}
                <div className={`${UI.CARD_BASE} p-8`}>
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                        <FaUser className="text-indigo-600"/>
                        <h2 className="font-bold text-slate-800 text-lg">Información Pública</h2>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        
                        {/* Avatar / Foto */}
                        <div className="flex flex-col items-center gap-3 w-full md:w-auto">
                            <div className="relative group">
                                <div 
                                    className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-slate-400 overflow-hidden relative cursor-pointer"
                                    onClick={triggerFileInput}
                                >
                                    {photoLoading ? (
                                        <FaSpinner className="animate-spin text-indigo-500" />
                                    ) : user?.photoURL ? (
                                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-slate-500">{getInitials()}</span>
                                    )}
                                    
                                    {/* Overlay de edición (Cámara) */}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <FaCamera className="text-white text-xl" />
                                    </div>
                                </div>

                                {/* Botón ELIMINAR FOTO (Solo si hay foto y no está cargando) */}
                                {user?.photoURL && !photoLoading && (
                                    <button 
                                        onClick={handleDeletePhoto}
                                        className="absolute bottom-0 right-0 bg-red-100 text-red-600 p-2 rounded-full border-2 border-white shadow-md hover:bg-red-200 transition-colors z-10"
                                        title="Eliminar foto"
                                    >
                                        <FaTrashAlt size={12} />
                                    </button>
                                )}
                            </div>

                            <button 
                                type="button" 
                                onClick={triggerFileInput}
                                className="text-xs font-bold text-indigo-600 hover:underline"
                                disabled={photoLoading}
                            >
                                {photoLoading ? 'Procesando...' : 'Cambiar foto'}
                            </button>
                            
                            {/* Input oculto para subir archivo */}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                            />
                        </div>

                        {/* Formulario Nombre */}
                        <form onSubmit={handleUpdateProfile} className="flex-1 w-full space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider text-[10px]">Nombre de Usuario</label>
                                    <span className={`text-[10px] font-bold ${displayName.length === MAX_NAME_LENGTH ? 'text-red-500' : 'text-slate-400'}`}>
                                        {displayName.length}/{MAX_NAME_LENGTH}
                                    </span>
                                </div>
                                <input 
                                    type="text" 
                                    className={UI.INPUT_TEXT}
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Tu nombre visible"
                                    maxLength={MAX_NAME_LENGTH}
                                />
                                <p className="text-xs text-slate-400">Este nombre será visible para tu equipo en tareas y comentarios.</p>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button 
                                    type="submit" 
                                    disabled={loading || displayName.length === 0} 
                                    className={`${UI.BTN_PRIMARY} px-6`}
                                >
                                    {loading ? <FaSpinner className="animate-spin" /> : <><FaSave /> Guardar Cambios</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* --- TARJETA 2: SEGURIDAD --- */}
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
                            <p className="text-xs text-slate-400 mt-1 max-w-md">
                                Si necesitas cambiar tu contraseña, te enviaremos un enlace seguro a tu correo electrónico para que puedas hacerlo.
                            </p>
                        </div>

                        <button 
                            type="button"
                            onClick={handleResetPassword}
                            disabled={loading}
                            className="w-full md:w-auto bg-white border border-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl hover:bg-slate-50 hover:text-orange-600 transition-colors shadow-sm whitespace-nowrap"
                        >
                            Enviar correo de recuperación
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UserProfile;