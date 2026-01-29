// src/layouts/NotificationsDropdown.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaComment, FaUserTag, FaCheckCircle, FaExclamationCircle, FaBellSlash } from 'react-icons/fa';

const NotificationItem = ({ notification, onNotificationClick }) => {
  const getNotificationDetails = () => {
    // ESTILO REFINADO: Iconos sin fondo, usando color directo.
    switch (notification.event_type) {
      case 'ISSUE_ASSIGNMENT':
        return { icon: <FaUserTag className="text-indigo-500 w-5 h-5" />, message: <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">{notification.actor_name}</span> te asignó el ticket <span className="font-semibold text-indigo-600">{notification.issue_id}</span></p> };
      case 'STATUS_CHANGE':
        return { icon: <FaCheckCircle className="text-emerald-500 w-5 h-5" />, message: <p className="text-sm text-slate-600">Estado de <span className="font-semibold text-slate-800">{notification.issue_id}</span> cambió a <span className="font-bold text-emerald-600">{notification.metadata?.to}</span></p> };
      case 'NEW_COMMENT':
        return { icon: <FaComment className="text-slate-500 w-5 h-5" />, message: <p className="text-sm text-slate-600 italic">"{notification.metadata?.comment_preview}"</p> };
      default:
        return { icon: <FaExclamationCircle className="text-red-500 w-5 h-5" />, message: <p className="text-sm text-slate-600">Nueva actualización en el sistema</p> };
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
      {/* ESTILO REFINADO: Borde izquierdo para no leídos, sin fondo de color. */}
      <Link to={linkTo} onClick={() => onNotificationClick(notification.id)} className={`flex items-start p-4 hover:bg-slate-100 transition-colors border-b border-slate-100 ${!notification.is_read ? 'border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}>
        <div className="shrink-0 w-8 text-center">{icon}</div>
        <div className="ml-3 flex-1">
          {message}
          <p className="text-xs text-slate-400 mt-1.5">{formatTimeAgo(notification.created_at)}</p>
        </div>
        {!notification.is_read && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mt-1.5 shrink-0"></div>}
      </Link>
    </li>
  );
};

const NotificationsDropdown = ({ notifications = [], onNotificationClick, onMarkAllAsRead }) => {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-slate-200 z-[100] animate-scale-in overflow-hidden font-sans">
      {/* ESTILO REFINADO: Cabecera más limpia */}
      <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800">Notificaciones</h3>
        {unreadCount > 0 && (
          <button onClick={onMarkAllAsRead} className="text-sm font-medium text-indigo-600 hover:underline">
            Marcar todo como leído
          </button>
        )}
      </div>

      <ul className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {notifications.length > 0 ? (
          notifications.map(notif => <NotificationItem key={notif.id} notification={notif} onNotificationClick={onNotificationClick} />)
        ) : (
          /* ESTILO REFINADO: Estado vacío coherente */
          <li className="p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FaBellSlash className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Todo al día</p>
              <p className="text-xs text-slate-500 mt-1">No tienes avisos pendientes.</p>
            </div>
          </li>
        )}
      </ul>

      {notifications.length > 0 && (
        <div className="p-3 bg-slate-50 text-center border-t border-slate-200">
          <Link to="/notificaciones" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
            Ver todas
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
