import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { resetPassword, verifyResetCode, confirmPasswordReset } from '../../services/auth'; // Importamos resetPassword (enviar mail)
import { FaLock, FaCheckCircle, FaExclamationCircle, FaSpinner, FaArrowLeft, FaEnvelope, FaKey, FaArrowRight } from 'react-icons/fa';

// --- DESIGN TOKENS (Homologados) ---
const UI = {
    INPUT_WRAPPER: "relative group",
    INPUT_ICON: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-lg",
    INPUT: "w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400",
    BTN_PRIMARY: "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-3 active:scale-[0.99] text-lg",
};

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const oobCode = searchParams.get('oobCode');

    // MODO: 'request' (pedir link) o 'reset' (poner nueva password)
    const mode = oobCode ? 'reset' : 'request';

    // Estados Globales
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Estados 'Request'
    const [email, setEmail] = useState('');

    // Estados 'Reset'
    const [validCode, setValidCode] = useState(false); // Para saber si mostramos el form
    const [verifyingCode, setVerifyingCode] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [resetEmail, setResetEmail] = useState(''); // Email recuperado del código

    // 1. EFECTO: Si hay código, verificarlo al cargar
    useEffect(() => {
        if (mode === 'reset') {
            const verify = async () => {
                setVerifyingCode(true);
                const res = await verifyResetCode(oobCode);
                if (res.success) {
                    setValidCode(true);
                    setResetEmail(res.email);
                } else {
                    setError('El enlace es inválido o ha expirado.');
                }
                setVerifyingCode(false);
            };
            verify();
        }
    }, [oobCode, mode]);

    // HANDLER: Solicitar Link (Modo Request)
    const handleRequestLink = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        const res = await resetPassword(email); // Función de auth.js que envía el correo
        setLoading(false);

        if (res.success) {
            setSuccessMsg('Hemos enviado un enlace de recuperación a tu correo.');
            setEmail('');
        } else {
            setError(res.error.code === 'auth/user-not-found' ? 'No existe una cuenta con este correo.' : 'Error al enviar el correo.');
        }
    };

    // HANDLER: Confirmar Cambio (Modo Reset)
    const handleConfirmReset = async (e) => {
        e.preventDefault();
        if (password !== confirmPass) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 6) {
            setError('Mínimo 6 caracteres.');
            return;
        }

        setLoading(true);
        const res = await confirmPasswordReset(oobCode, password);
        setLoading(false);

        if (res.success) {
            setSuccessMsg('¡Contraseña actualizada correctamente!');
            setTimeout(() => navigate('/login'), 3000);
        } else {
            setError('Error al actualizar. El enlace puede haber expirado.');
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-white font-sans">
            
            {/* --- SECCIÓN IZQUIERDA: BRANDING --- */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden items-center justify-center text-white p-12">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                
                <div className="relative z-10 max-w-lg text-center flex flex-col items-center">
                    <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
                        <FaLock className="text-5xl text-white drop-shadow-md" />
                    </div>
                    <h1 className="text-5xl font-black mb-6 tracking-tight text-white">Seguridad</h1>
                    <p className="text-slate-300 text-xl leading-relaxed font-light opacity-90">
                        Recupera el acceso a tu cuenta de forma segura y continúa gestionando tus proyectos sin interrupciones.
                    </p>
                </div>
            </div>

            {/* --- SECCIÓN DERECHA: FORMULARIO DINÁMICO --- */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 bg-white relative">
                <div className="w-full max-w-md space-y-8">
                    
                    <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors mb-4">
                        <FaArrowLeft size={12}/> Volver al Login
                    </Link>

                    {/* ESTADO: Verificando Código */}
                    {mode === 'reset' && verifyingCode && (
                        <div className="text-center py-10">
                            <FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto mb-4"/>
                            <p className="text-slate-500 font-medium">Verificando enlace de seguridad...</p>
                        </div>
                    )}

                    {/* CONTENIDO PRINCIPAL (Si no está verificando) */}
                    {(!verifyingCode) && (
                        <>
                            <div className="text-center lg:text-left">
                                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                                    {mode === 'request' ? 'Recuperar Contraseña' : 'Nueva Contraseña'}
                                </h2>
                                <p className="text-slate-500 text-lg">
                                    {mode === 'request' 
                                        ? 'Ingresa tu correo para recibir las instrucciones.' 
                                        : error && !validCode ? 'Enlace no válido.' : `Ingresa nuevas credenciales para ${resetEmail}`
                                    }
                                </p>
                            </div>

                            {/* Mensajes Globales */}
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl text-sm flex items-start gap-3 animate-fade-in shadow-sm">
                                    <FaExclamationCircle className="mt-0.5 flex-shrink-0 text-lg" />
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}

                            {successMsg && (
                                <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-r-xl text-sm flex items-start gap-3 animate-fade-in shadow-sm">
                                    <FaCheckCircle className="mt-0.5 flex-shrink-0 text-lg" />
                                    <span className="font-medium">{successMsg}</span>
                                </div>
                            )}

                            {/* FORMULARIO A: SOLICITAR LINK (REQUEST) */}
                            {mode === 'request' && !successMsg && (
                                <form onSubmit={handleRequestLink} className="space-y-6">
                                    <div className={UI.INPUT_WRAPPER}>
                                        <FaEnvelope className={UI.INPUT_ICON} />
                                        <input 
                                            type="email" 
                                            required 
                                            placeholder="tucorreo@ejemplo.com"
                                            className={UI.INPUT} 
                                            value={email} 
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" disabled={loading} className={UI.BTN_PRIMARY}>
                                        {loading ? <><FaSpinner className="animate-spin text-xl" /> Enviando...</> : <>Enviar Enlace <FaArrowRight /></>}
                                    </button>
                                </form>
                            )}

                            {/* FORMULARIO B: CAMBIAR PASSWORD (RESET) */}
                            {mode === 'reset' && validCode && !successMsg && (
                                <form onSubmit={handleConfirmReset} className="space-y-6">
                                    <div className={UI.INPUT_WRAPPER}>
                                        <FaKey className={UI.INPUT_ICON} />
                                        <input 
                                            type="password" 
                                            required 
                                            placeholder="Nueva contraseña"
                                            className={UI.INPUT} 
                                            value={password} 
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className={UI.INPUT_WRAPPER}>
                                        <FaLock className={UI.INPUT_ICON} />
                                        <input 
                                            type="password" 
                                            required 
                                            placeholder="Confirmar contraseña"
                                            className={UI.INPUT} 
                                            value={confirmPass} 
                                            onChange={(e) => setConfirmPass(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" disabled={loading} className={UI.BTN_PRIMARY}>
                                        {loading ? <><FaSpinner className="animate-spin text-xl" /> Guardando...</> : <>Actualizar Password <FaCheckCircle /></>}
                                    </button>
                                </form>
                            )}
                            
                            {/* Caso Borde: Link inválido en modo reset */}
                            {mode === 'reset' && !validCode && !verifyingCode && (
                                <div className="text-center">
                                    <Link to="/reset-password" className="text-indigo-600 font-bold hover:underline">
                                        Solicitar un nuevo enlace aquí
                                    </Link>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;