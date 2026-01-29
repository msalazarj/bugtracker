// src/pages/Auth/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaBug, FaEnvelope, FaLock, FaSignInAlt, FaSpinner } from 'react-icons/fa';

const InputField = React.forwardRef(({ icon, ...props }, ref) => (
    <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
            {icon}
        </span>
        <input
            ref={ref}
            className="w-full pl-12 pr-3 py-3 bg-slate-50 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            {...props}
        />
    </div>
));

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const { signIn, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const userCredential = await signIn(email, password);
            const user = userCredential.user;

            // **Inicio de la Corrección de Roles**
            // Después del login, verifica y estandariza el rol del usuario en su perfil.
            if (user) {
                const profileRef = doc(db, 'profiles', user.uid);
                const profileSnap = await getDoc(profileRef);

                if (profileSnap.exists()) {
                    const profileData = profileSnap.data();
                    const currentRole = profileData.role;

                    // Si el rol es uno de los antiguos, actualizarlo a 'Admin'.
                    if (currentRole === 'Owner' || currentRole === 'Administrador') {
                        await updateDoc(profileRef, { role: 'Admin' });
                    }
                }
            }
            // **Fin de la Corrección de Roles**

            navigate('/dashboard');
        } catch (err) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('El correo electrónico o la contraseña son incorrectos.');
            } else {
                console.error("Error de inicio de sesión inesperado:", err);
                setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
                {/* Columna de Branding */}
                <div className="bg-slate-900 text-white p-12 flex flex-col justify-center items-start">
                    <div className="w-full max-w-md">
                        <div className="flex items-center gap-3 mb-8">
                            <FaBug className="text-indigo-400 text-3xl" />
                            <span className="text-2xl font-bold tracking-wider text-slate-200">PrimeBug</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 text-white">
                            Plataforma de Gestión de Incidencias
                        </h1>
                        <p className="text-slate-300 text-lg">
                           Herramienta exclusiva para el seguimiento y resolución de bugs.
                        </p>
                    </div>
                </div>

                {/* Columna del Formulario */}
                <div className="flex flex-col justify-center items-center p-8 md:p-12 bg-white">
                    <div className="w-full max-w-sm">
                        <div className="text-left mb-8">
                            <h2 className="text-3xl font-bold text-slate-800">Bienvenido de Nuevo</h2>
                            <p className="mt-2 text-slate-500">Inicia sesión para acceder a la plataforma.</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert">
                                <p className="font-bold">Error de Autenticación</p>
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <InputField icon={<FaEnvelope />} type="email" placeholder="jorge.salazar@aguasnuevas.cl" required value={email} onChange={(e) => setEmail(e.target.value)} />
                            <InputField icon={<FaLock />} type="password" placeholder="Contraseña" required value={password} onChange={(e) => setPassword(e.target.value)} />
                            
                            <div className="text-sm text-right">
                                <Link to="/recuperar-clave" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">¿Olvidaste tu contraseña?</Link>
                            </div>

                            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center py-3 text-base font-semibold">
                                {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaSignInAlt className="mr-2" />}
                                {loading ? 'Verificando...' : 'Iniciar Sesión'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-slate-500 mt-8">
                            ¿No tienes una cuenta?{' '}
                            <Link to="/registro" className="font-semibold text-indigo-600 hover:underline">Regístrate aquí</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
