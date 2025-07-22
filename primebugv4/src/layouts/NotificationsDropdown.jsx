// src/layouts/NotificationsDropdown.jsx
import React from 'react';
import { Link } from 'react-router-dom';
// COMENTARIO: Se añade FaBellSlash para el estado vacío.
import { FaBell, FaComment, FaUserTag, FaCheckCircle, FaExclamationCircle, FaBellSlash } from 'react-icons/fa';

// --- Mock Data para simular notificaciones ---
export const mockNotifications = [
  {
    id: 'notif_001',
    actor: { id: 'user_02', name: 'Juan Probador' },
    event_type: 'ISSUE_ASSIGNMENT',
    issue: { id: 'PRTRCK-101' },
    project: { id: 'proyecto_mock_001' },
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif_002',
    actor: { id: 'user_01', name: 'Ana Desarrolladora' },
    event_type: 'STATUS_CHANGE',
    issue: { id: 'PRTRCK-99' },
    project: { id: 'proyecto_mock_001' },
    metadata: { from: 'En Progreso', to: 'Resuelto' },
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif_003',
    actor: { id: 'user_03', name: 'Carlos Creador' },
    event_type: 'NEW_COMMENT',
    issue: { id: 'MCLOUD-12' },
    project: { id: 'proyecto_mock_002' },
    metadata: { comment_preview: '¿Podrías revisar el último despliegue?' },
    is_read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// --- Componente para un item de notificación individual ---
const NotificationItem = ({ notification, onNotificationClick }) => {
  const getNotificationDetails = () => {
    // COMENTARIO: Se usan los colores de la paleta de diseño.
    switch (notification.event_type) {
      case 'ISSUE_ASSIGNMENT':
        return {
          icon: <FaUserTag className="text-[#3B82F6]" />, // Azul
          message: <><strong className="font-semibold text-gray-900">{notification.actor.name}</strong> te ha asignado el issue <strong>{notification.issue.id}</strong>.</>,
        };
      case 'STATUS_CHANGE':
        return {
          icon: <FaCheckCircle className="text-[#22C55E]" />, // Verde
          message: <><strong className="font-semibold text-gray-900">{notification.actor.name}</strong> cambió el estado de <strong>{notification.issue.id}</strong> a <span className="font-semibold">{notification.metadata.to}</span>.</>,
        };
      case 'NEW_COMMENT':
        return {
          icon: <FaComment className="text-gray-500" />,
          message: <><strong className="font-semibold text-gray-900">{notification.actor.name}</strong> comentó en <strong>{notification.issue.id}</strong>: <span className="italic text-gray-700">"{notification.metadata.comment_preview}"</span></>,
        };
      default:
        return {
          icon: <FaExclamationCircle className="text-red-500" />,
          message: 'Tienes una nueva notificación.',
        };
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
    return 'justo ahora';
  };

  const { icon, message } = getNotificationDetails();
  const linkTo = `/proyectos/${notification.project.id}/issues/${notification.issue.id}`;

  return (
    <li>
      <Link to={linkTo} onClick={onNotificationClick} className="flex items-start p-4 hover:bg-gray-100 transition-colors duration-150 border-b border-gray-100">
        {!notification.is_read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-1.5 shrink-0" title="No leído"></div>
        )}
        <div className={`shrink-0 w-5 text-center ${notification.is_read ? 'ml-5' : ''}`}>{icon}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-gray-800 leading-snug">{message}</p>
          <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.created_at)}</p>
        </div>
      </Link>
    </li>
  );
};


// --- Componente principal del Dropdown ---
const NotificationsDropdown = ({ notifications, onNotificationClick, onMarkAllAsRead }) => {
  return (
    <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="flex justify-between items-center p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Notificaciones</h3>
        {/* COMENTARIO: Botón con estilo mejorado */}
        <button onClick={onMarkAllAsRead} className="text-xs text-blue-600 hover:bg-blue-50 font-semibold rounded-md px-2 py-1 transition-colors">
          Marcar todo como leído
        </button>
      </div>
      <ul className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(notif => (
            <NotificationItem key={notif.id} notification={notif} onNotificationClick={onNotificationClick} />
          ))
        ) : (
          // COMENTARIO: Estado vacío mejorado con un ícono.
          <li className="p-8 text-center text-gray-500">
            <div className="flex flex-col items-center">
              <FaBellSlash className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-sm">No tienes notificaciones nuevas.</p>
            </div>
          </li>
        )}
      </ul>
      {notifications.length > 0 && (
         <div className="p-2 bg-gray-50 text-center border-t border-gray-200">
            <Link to="/notificaciones" className="text-sm font-semibold text-blue-600 hover:underline p-2 block">
              Ver todas
            </Link>
         </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;