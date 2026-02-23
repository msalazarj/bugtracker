import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';

// --- ICONS & ASSETS ---
import { FaEnvelope, FaLock, FaBug, FaSpinner, FaArrowRight, FaExclamationCircle } from 'react-icons/fa';

// --- DESIGN TOKENS ---
const UI = {
    INPUT_WRAPPER: "relative group",
    INPUT_ICON: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-lg",
    INPUT: "w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400",
    BTN_PRIMARY: "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-3 active:scale-[0.99] text-lg",
};

const Login = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth(); 

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await loginUser(formData.email, formData.password);

        if (result.data) {
            navigate('/dashboard');
        } else {
            const msg = result.error.code === 'auth/invalid-credential' 
                ? 'Credenciales incorrectas. Verifica tu correo y contraseña.'
                : 'Ocurrió un error al iniciar sesión. Intenta nuevamente.';
            setError(msg);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-white font-sans">
            
            {/* --- SECCIÓN IZQUIERDA: BRANDING (Hero) --- */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 to-violet-800 relative overflow-hidden items-center justify-center text-white p-12">
                
                {/* Fondo Abstracto (Decorativo) */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full mix-blend-overlay opacity-5 blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400 rounded-full mix-blend-overlay opacity-20 blur-[100px]"></div>

                {/* Contenido Central - PROTAGONISTA */}
                <div className="relative z-10 max-w-lg text-center flex flex-col items-center">
                    
                    {/* Ícono Gigante estilo Glassmorphism */}
                    <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-10 border border-white/20 shadow-2xl shadow-indigo-900/50 transform hover:scale-105 transition-transform duration-500">
                        <FaBug className="text-6xl text-white drop-shadow-md" />
                    </div>
                    
                    {/* Título Masivo */}
                    <h1 className="text-6xl font-black mb-6 tracking-tight text-white drop-shadow-sm">
                        PrimeBug
                    </h1>
                    
                    {/* Subtítulo Limpio */}
                    <p className="text-indigo-100 text-xl leading-relaxed font-light opacity-90 max-w-md">
                        Plataforma integral para el control de calidad y gestión de incidencias.
                    </p>

                </div>
            </div>

            {/* --- SECCIÓN DERECHA: FORMULARIO --- */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-24 bg-white relative">
                
                <div className="w-full max-w-md space-y-10">
                    
                    {/* Header Móvil (Solo visible en pantallas pequeñas) */}
                    <div className="lg:hidden text-center mb-10">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                            <FaBug className="text-3xl text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">PrimeBug</h2>
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">¡Hola de nuevo!</h2>
                        <p className="text-slate-500 text-lg">
                            Ingresa tus credenciales para continuar.
                        </p>
                    </div>

                    {/* Mensaje de Error */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl text-sm flex items-start gap-3 animate-fade-in shadow-sm">
                            <FaExclamationCircle className="mt-0.5 flex-shrink-0 text-lg" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Correo Electrónico</label>
                            <div className={UI.INPUT_WRAPPER}>
                                <FaEnvelope className={UI.INPUT_ICON} />
                                <input 
                                    type="email" 
                                    name="email"
                                    required
                                    placeholder="nombre@empresa.com"
                                    className={UI.INPUT}
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-bold text-slate-700">Contraseña</label>
                                <Link to="/reset-password" class="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <div className={UI.INPUT_WRAPPER}>
                                <FaLock className={UI.INPUT_ICON} />
                                <input 
                                    type="password" 
                                    name="password"
                                    required
                                    placeholder="••••••••"
                                    className={UI.INPUT}
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={loading} className={UI.BTN_PRIMARY}>
                            {loading ? (
                                <><FaSpinner className="animate-spin text-xl" /> Iniciando...</>
                            ) : (
                                <>Iniciar Sesión <FaArrowRight /></>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="pt-4 text-center">
                        <p className="text-slate-500">
                            ¿No tienes una cuenta?{' '}
                            <Link to="/registro" className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
                                Crear cuenta
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;