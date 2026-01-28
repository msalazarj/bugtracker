// src/pages/Auth/UpdatePassword.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Usamos el contexto en lugar del servicio directo

/**
 * @file Componente para actualizar la contraseña.
 * En Firebase, el usuario debe tener una sesión activa (generada por el link de reset)
 * para poder ejecutar esta acción.
 */

const UpdatePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { updatePassword, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificamos si hay un usuario en el contexto. 
    // Firebase Auth persiste la sesión del link de recuperación automáticamente.
    if (!loading && !user) {
      setError('Sesión inválida o expirada. Por favor, solicita un nuevo enlace de recuperación.');
      const timer = setTimeout(() => navigate('/login'), 4000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validaciones de UI
    if (newPassword !== confirmNewPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 8) { // Firebase recomienda al menos 8 por seguridad
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard'); 
      }, 3000);
    } catch (updateError) {
      console.error('Update password error:', updateError.code);
      
      // UX: Manejo de error por sesión expirada o re-autenticación necesaria
      if (updateError.code === 'auth/requires-recent-login') {
        setError('Por seguridad, esta operación requiere un inicio de sesión reciente. Intenta solicitar el enlace de nuevo.');
      } else {
        setError(`Error: ${updateError.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Actualizar Contraseña</h2>
          <p className="text-sm text-gray-600 mt-1">Ingresa tu nueva clave de acceso</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm text-center">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm text-center">
              Tu contraseña ha sido actualizada exitosamente. Redirigiendo...
            </div>
          )}

          <div>
            <label htmlFor="newPassword" className="block text-gray-700 text-sm font-semibold mb-1">
              Nueva Contraseña
            </label>
            <input
              type="password"
              id="newPassword"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Mínimo 8 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="confirmNewPassword" className="block text-gray-700 text-sm font-semibold mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              id="confirmNewPassword"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Repite la contraseña"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className={`w-full font-bold py-2 px-4 rounded-md transition-colors ${
                loading || success 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              }`}
              disabled={loading || success}
            >
              {loading ? 'Procesando...' : 'Actualizar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;