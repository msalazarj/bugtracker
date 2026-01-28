// src/pages/Auth/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validaciones de UI/UX
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // Llamamos a signUp que ahora maneja internamente Auth y Firestore
      await signUp(email, password, { nombre_completo: nombreCompleto });
      
      // UX: En Firebase el usuario ya está logueado al registrarse, 
      // pero por seguridad y flujo de la app, lo mandamos al login o dashboard.
      alert('¡Registro exitoso! Ya puedes utilizar PrimeTrack.');
      navigate('/dashboard');
    } catch (err) {
      console.error("Error en registro:", err.code);
      
      // Mapeo de errores de Firebase para el usuario
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está registrado.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo no es válido.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es muy débil.');
      } else {
        setError('Ocurrió un error inesperado: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Crear Cuenta</h2>
          <p className="mt-2 text-sm text-gray-600">Únete a PrimeTrack Bug Tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700 text-center animate-pulse">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Campo: Nombre Completo */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <FaUser className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  className="input-field w-full pl-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Tu Nombre Completo"
                  required
                />
              </div>
            </div>

            {/* Campo: Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <FaEnvelope className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  className="input-field w-full pl-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@ejemplo.com"
                  required
                />
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <FaLock className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  className="input-field w-full pl-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>
            </div>

            {/* Campo: Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Repetir Contraseña
              </label>
              <div className="relative">
                <FaLock className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  id="confirmPassword"
                  className="input-field w-full pl-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={`btn-primary w-full py-3 rounded-md font-bold text-white transition-colors ${
              loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'
            }`}
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Registrar'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-4">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Iniciar Sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;