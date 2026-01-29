// src/pages/Auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaBug, FaEnvelope, FaPaperPlane, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';

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

const ForgotPassword = () => {
    const { resetPassword, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        try {
            await resetPassword(email);
            setSuccess(true);
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                setError('No se encontró ninguna cuenta con este correo electrónico.');
            } else {
                setError('Hubo un problema al enviar el enlace. Por favor, inténtalo de nuevo.');
            }
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
                           Herramienta exclusiva para el seguimiento y resolución de bugs en los proyectos de Aguas Nuevas.
                        </p>
                    </div>
                </div>

                {/* Columna del Formulario (Derecha) - CORREGIDA */}
                <div className="flex flex-col justify-center items-center p-8 md:p-12">
                    <div className="w-full max-w-sm">

                        {!success ? (
                            <>
                                <div className="text-left mb-8">
                                    <h2 className="text-3xl font-bold text-slate-800">Recupera tu Acceso</h2>
                                    <p className="mt-2 text-slate-600">Ingresa tu correo y te enviaremos un enlace seguro para restablecer tu contraseña.</p>
                                </div>

                                {error && (
                                    <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-lg mb-6" role="alert">
                                        <p className="font-semibold">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <InputField icon={<FaEnvelope />} type="email" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                                    <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center py-3 text-base font-medium">
                                        <FaPaperPlane className="mr-2" />
                                        {loading ? 'Enviando enlace...' : 'Enviar Enlace de Recuperación'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center">
                                <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-6" />
                                <h2 className="text-3xl font-bold text-slate-800">¡Enlace Enviado!</h2>
                                <p className="mt-3 text-slate-600 text-base">
                                    Hemos enviado un correo a <span className="font-semibold text-indigo-600">{email}</span>.
                                    Por favor, revisa tu bandeja de entrada para continuar.
                                </p>
                            </div>
                        )}

                        <p className="text-center text-sm text-slate-600 mt-8">
                            <Link to="/login" className="font-semibold text-indigo-600 hover:underline inline-flex items-center">
                                <FaArrowLeft className="mr-2" />
                                Volver a Iniciar Sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
