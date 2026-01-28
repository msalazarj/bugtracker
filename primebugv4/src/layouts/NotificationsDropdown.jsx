// src/layouts/NotificationsDropdown.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBell, FaComment, FaUserTag, 
  FaCheckCircle, FaExclamationCircle, FaBellSlash 
} from 'react-icons/fa';

/**
 * Componente para un item de notificación individual.
 * Optimizado para renderizar datos provenientes de Firestore.
 */
const NotificationItem = ({ notification, onNotificationClick }) => {
  const getNotificationDetails = () => {
    switch (notification.event_type) {
      case 'ISSUE_ASSIGNMENT':
        return {
          icon: <div className="p-2 bg-indigo-50 rounded-lg"><FaUserTag className="text-indigo-600" /></div>,
          message: (
            <p className="text-sm text-slate-600">
              <span className="font-bold text-slate-900">{notification.actor_name}</span> te asignó el ticket <span className="font-bold text-indigo-600">{notification.issue_id}</span>
            </p>
          ),
        };
      case 'STATUS_CHANGE':
        return {
          icon: <div className="p-2 bg-emerald-50 rounded-lg"><FaCheckCircle className="text-emerald-600" /></div>,
          message: (
            <p className="text-sm text-slate-600">
              Estado de <span className="font-bold text-slate-900">{notification.issue_id}</span> cambiado a <span className="font-bold text-emerald-600">{notification.metadata?.to}</span>
            </p>
          ),
        };
      case 'NEW_COMMENT':
        return {
          icon: <div className="p-2 bg-slate-100 rounded-lg"><FaComment className="text-slate-500" /></div>,
          message: (
            <p className="text-sm text-slate-600 italic">
              "{notification.metadata?.comment_preview}"
            </p>
          ),
        };
      default:
        return {
          icon: <div className="p-2 bg-red-50 rounded-lg"><FaExclamationCircle className="text-red-500" /></div>,
          message: <p className="text-sm text-slate-600">Nueva actualización en el sistema</p>,
        };
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'justo ahora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    return new Date(date).toLocaleDateString();
  };

  const { icon, message } = getNotificationDetails();
  const linkTo = `/proyectos/${notification.project_id}/issues/${notification.issue_id}`;

  return (
    <li>
      <Link 
        to={linkTo} 
        onClick={() => onNotificationClick(notification.id)} 
        className={`flex items-start p-4 hover:bg-slate-50 transition-all border-b border-slate-100 ${!notification.is_read ? 'bg-indigo-50/30' : ''}`}
      >
        <div className="shrink-0">{icon}</div>
        <div className="ml-4 flex-1">
          {message}
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">
            {formatTimeAgo(notification.created_at)}
          </p>
        </div>
        {!notification.is_read && (
          <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0 animate-pulse"></div>
        )}
      </Link>
    </li>
  );
};

const NotificationsDropdown = ({ notifications = [], onNotificationClick, onMarkAllAsRead }) => {
  return (
    <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] animate-scale-in overflow-hidden">
      <div className="flex justify-between items-center p-4 bg-white border-b border-slate-50">
        <h3 className="font-black text-slate-800 tracking-tight">Notificaciones</h3>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={onMarkAllAsRead} 
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
          >
            Marcar lectura
          </button>
        )}
      </div>

      <ul className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {notifications.length > 0 ? (
          notifications.map(notif => (
            <NotificationItem 
              key={notif.id} 
              notification={notif} 
              onNotificationClick={onNotificationClick} 
            />
          ))
        ) : (
          <li className="p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <FaBellSlash className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400">Todo al día</p>
              <p className="text-xs text-slate-300 mt-1">No tienes avisos pendientes</p>
            </div>
          </li>
        )}
      </ul>

      {notifications.length > 0 && (
        <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
          <Link to="/notificaciones" className="text-xs font-black text-slate-500 hover:text-indigo-600 uppercase tracking-widest transition-colors">
            Ver historial completo
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;