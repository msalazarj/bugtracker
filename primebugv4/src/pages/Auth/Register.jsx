// src/pages/Auth/Register.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
// COMENTARIO: Se importan los íconos de react-icons/fa
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
      // COMENTARIO: Ahora se pasa el nombre completo en un objeto de datos adicionales.
      await signUp(email, password, { nombre_completo: nombreCompleto });
      alert('¡Registro exitoso! Por favor, revisa tu email para confirmar tu cuenta.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800">Crear Cuenta</h2>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && <p className="rounded-md bg-red-50 p-4 text-sm text-red-700 text-center">{error}</p>}
          
          {/* COMENTARIO: Se aplica el estilo estándar con íconos a todos los campos. */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <div className="relative">
              <FaUser className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text" id="name" className="input-field pl-10" value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Tu Nombre Completo" required
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <FaEnvelope className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="email" id="email" className="input-field pl-10" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@ejemplo.com" required
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <FaLock className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="password" id="password" className="input-field pl-10" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres" required
              />
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Repetir Contraseña</label>
            <div className="relative">
              <FaLock className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="password" id="confirmPassword" className="input-field pl-10" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña" required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>
        <p className="text-center text-gray-600 text-sm mt-4">
          ¿Ya tienes una cuenta? <Link to="/login" className="font-medium text-blue-600 hover:underline">Iniciar Sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;