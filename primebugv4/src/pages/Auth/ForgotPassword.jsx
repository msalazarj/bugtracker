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
      if (err.code === 'auth/user-not-found') {
        setError('No existe ninguna cuenta asociada a este correo.');
      } else {
        setError('Error al enviar el enlace. Intenta de nuevo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <h2 className="text-2xl font-black text-center text-slate-800 mb-2">
          Recuperar Contraseña
        </h2>
        
        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-xs font-bold text-center">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <FaEnvelope className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-300" />
                <input
                  type="email"
                  className="input-field pl-11 w-full p-2 border rounded"
                  placeholder="ejemplo@primebug.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full p-2 bg-blue-600 text-white rounded font-bold" disabled={loading}>
              {loading ? 'Procesando...' : 'Enviar Enlace'}
            </button>
          </form>
        ) : (
          <div className="text-center bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
            <h3 className="font-black text-emerald-800">¡Enlace enviado!</h3>
            <p className="text-emerald-700 mt-2 text-xs">Revisa tu bandeja de entrada para restablecer tu contraseña.</p>
          </div>
        )}
        <div className="mt-8 pt-6 border-t text-center">
          <Link to="/login" className="text-xs font-black text-indigo-600 uppercase">Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;