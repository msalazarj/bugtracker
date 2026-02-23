import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';

// --- ICONS & ASSETS ---
import { FaUser, FaEnvelope, FaLock, FaBug, FaSpinner, FaArrowRight, FaExclamationCircle } from 'react-icons/fa';

// --- DESIGN TOKENS (Homologados) ---
const UI = {
    INPUT_WRAPPER: "relative group",
    INPUT_ICON: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-lg",
    INPUT: "w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400",
    BTN_PRIMARY: "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-3 active:scale-[0.99] text-lg",
};

const Register = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        const result = await registerUser(formData.email, formData.password, formData.fullName);

        if (result.data) {
            navigate('/dashboard');
        } else {
            const msg = result.error.code === 'auth/email-already-in-use'
                ? 'Este correo electrónico ya está registrado.'
                : 'Ocurrió un error al registrarse. Intenta nuevamente.';
            setError(msg);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-white font-sans">
            
            {/* --- SECCIÓN IZQUIERDA: BRANDING --- */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-violet-800 to-indigo-900 relative overflow-hidden items-center justify-center text-white p-12">
                
                {/* Decoración de Fondo */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full mix-blend-overlay opacity-30 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500 rounded-full mix-blend-overlay opacity-20 blur-[100px]"></div>

                <div className="relative z-10 max-w-lg text-center flex flex-col items-center">
                    <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl shadow-violet-900/50">
                        <FaUser className="text-5xl text-white drop-shadow-md" />
                    </div>
                    <h1 className="text-5xl font-black mb-6 tracking-tight text-white">Únete al Equipo</h1>
                    <p className="text-indigo-100 text-xl leading-relaxed font-light opacity-90">
                        Crea tu cuenta en PrimeBug y comienza a gestionar tus proyectos con eficiencia y control total.
                    </p>
                </div>
            </div>

            {/* --- SECCIÓN DERECHA: FORMULARIO --- */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 bg-white relative">
                <div className="w-full max-w-md space-y-8">
                    
                    {/* Header Móvil */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                            <FaBug className="text-3xl text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900">PrimeBug</h2>
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Crear Cuenta</h2>
                        <p className="text-slate-500 text-lg">Completa tus datos para empezar.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl text-sm flex items-start gap-3 animate-fade-in shadow-sm">
                            <FaExclamationCircle className="mt-0.5 flex-shrink-0 text-lg" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        <div className={UI.INPUT_WRAPPER}>
                            <FaUser className={UI.INPUT_ICON} />
                            <input 
                                type="text" name="fullName" required placeholder="Nombre Completo"
                                className={UI.INPUT} value={formData.fullName} onChange={handleChange}
                            />
                        </div>

                        <div className={UI.INPUT_WRAPPER}>
                            <FaEnvelope className={UI.INPUT_ICON} />
                            <input 
                                type="email" name="email" required placeholder="correo@ejemplo.com"
                                className={UI.INPUT} value={formData.email} onChange={handleChange}
                            />
                        </div>

                        <div className={UI.INPUT_WRAPPER}>
                            <FaLock className={UI.INPUT_ICON} />
                            <input 
                                type="password" name="password" required placeholder="Contraseña (min. 6 caracteres)"
                                className={UI.INPUT} value={formData.password} onChange={handleChange}
                            />
                        </div>

                        <div className={UI.INPUT_WRAPPER}>
                            <FaLock className={UI.INPUT_ICON} />
                            <input 
                                type="password" name="confirmPassword" required placeholder="Confirmar Contraseña"
                                className={UI.INPUT} value={formData.confirmPassword} onChange={handleChange}
                            />
                        </div>

                        <button type="submit" disabled={loading} className={UI.BTN_PRIMARY}>
                            {loading ? <><FaSpinner className="animate-spin text-xl" /> Registrando...</> : <>Registrarse <FaArrowRight /></>}
                        </button>
                    </form>

                    <div className="pt-4 text-center">
                        <p className="text-slate-500">
                            ¿Ya tienes cuenta?{' '}
                            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
                                Iniciar Sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;