// src/pages/Auth/ForgotPassword.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaEnvelope } from 'react-icons/fa';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError('Error al enviar el correo. Asegúrate de que la dirección sea válida.');
      console.error('Reset password error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-2">Recuperar Contraseña</h2>
        <p className="text-center text-gray-600 mb-6">Ingresa tu correo y te enviaremos las instrucciones.</p>
        
        {!success ? (
          <form onSubmit={handleSubmit}>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <FaEnvelope className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  className="input-field w-full pl-10"
                  placeholder="tu@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Instrucciones'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center bg-green-100 p-4 rounded-md">
            <h3 className="font-bold text-green-800">¡Revisa tu correo!</h3>
            <p className="text-green-700 mt-1">
              Si existe una cuenta con la dirección proporcionada, hemos enviado un enlace para restablecer tu contraseña.
            </p>
          </div>
        )}
        
        <p className="text-center text-gray-600 text-sm mt-6">
          <Link to="/login" className="text-blue-500 hover:text-blue-800 font-bold">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;