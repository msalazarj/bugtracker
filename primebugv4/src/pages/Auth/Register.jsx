// src/pages/Auth/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaBug, FaEnvelope, FaLock, FaUser, FaUserPlus } from 'react-icons/fa';

const InputField = React.forwardRef(({ icon, ...props }, ref) => (
    <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
            {icon}
        </span>
        <input
            ref={ref}
            className="w-full pl-12 pr-3 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            {...props}
        />
    </div>
));

const Register = () => {
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const { signUp, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (password !== confirmPassword) { return setError('Las contraseñas no coinciden.'); }
        if (password.length < 8) { return setError('La contraseña debe tener al menos 8 caracteres.'); }
        try {
            await signUp(email, password, { nombre_completo: nombreCompleto });
            navigate('/dashboard');
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') { setError('Este correo electrónico ya está en uso.');
            } else if (err.code === 'auth/invalid-email') { setError('El formato del correo electrónico no es válido.');
            } else { setError('Ha ocurrido un error al crear la cuenta. Inténtalo de nuevo.'); }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
                {/* Columna de Branding (Izquierda) - CORREGIDA */}
                <div className="bg-slate-900 text-white p-12 flex flex-col justify-center items-start">
                    <div className="w-full max-w-md">
                        <div className="flex items-center gap-3 mb-8">
                            <FaBug className="text-indigo-500 text-3xl" />
                            <span className="text-2xl font-bold tracking-wider">Aguas Nuevas</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                           Plataforma de Gestión de Incidencias
                        </h1>
                        <p className="text-slate-300 text-lg">
                           Únete a la herramienta exclusiva para el seguimiento y resolución de bugs en los proyectos de Aguas Nuevas.
                        </p>
                    </div>
                </div>

                {/* Columna del Formulario (Derecha) - CORREGIDA */}
                <div className="flex flex-col justify-center items-center p-8 md:p-12">
                    <div className="w-full max-w-sm">
                        <div className="text-left mb-8">
                            <h2 className="text-3xl font-bold text-slate-800">Crea tu Cuenta</h2>
                            <p className="mt-2 text-slate-600">Regístrate para empezar a gestionar incidencias.</p>
                        </div>

                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-lg mb-6" role="alert">
                                <p className="font-semibold">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <InputField icon={<FaUser />} type="text" placeholder="Nombre Completo" required value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
                            <InputField icon={<FaEnvelope />} type="email" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                            <InputField icon={<FaLock />} type="password" placeholder="Contraseña (mín. 8 caracteres)" required value={password} onChange={(e) => setPassword(e.target.value)} />
                            <InputField icon={<FaLock />} type="password" placeholder="Confirmar Contraseña" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            
                            <div className="pt-2">
                               <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center py-3 text-base font-medium">
                                    <FaUserPlus className="mr-2" />
                                    {loading ? 'Creando cuenta...' : 'Crear Mi Cuenta'}
                                </button>
                            </div>
                        </form>

                        <p className="text-center text-sm text-slate-600 mt-8">
                            ¿Ya tienes una cuenta?{' '}
                            <Link to="/login" className="font-semibold text-indigo-600 hover:underline">Inicia Sesión aquí</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
