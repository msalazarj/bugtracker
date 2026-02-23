import React from 'react';
import { 
    FaUserTag, FaCheckCircle, FaComment, 
    FaFolderOpen, FaExclamationCircle, FaBellSlash 
} from 'react-icons/fa';

/**
 * Componente individual de notificación.
 */
const NotificationItem = ({ notification, onNotificationClick }) => {
  
  const getNotificationDetails = () => {
    switch (notification.type) {
      case 'BUG_ASSIGN':
        return { 
            icon: <FaUserTag className="text-blue-600 w-4 h-4" />, 
            bg: 'bg-blue-100',
            border: 'border-blue-200'
        };
      case 'BUG_STATUS':
        return { 
            icon: <FaCheckCircle className="text-emerald-600 w-4 h-4" />,
            bg: 'bg-emerald-100',
            border: 'border-emerald-200'
        };
      case 'BUG_COMMENT':
        return { 
            icon: <FaComment className="text-amber-600 w-4 h-4" />,
            bg: 'bg-amber-100',
            border: 'border-amber-200'
        };
      case 'PROJECT_ASSIGN':
        return { 
            icon: <FaFolderOpen className="text-purple-600 w-4 h-4" />,
            bg: 'bg-purple-100',
            border: 'border-purple-200'
        };
      default:
        return { 
            icon: <FaExclamationCircle className="text-slate-500 w-4 h-4" />,
            bg: 'bg-slate-100',
            border: 'border-slate-200'
        };
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'justo ahora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `hace ${days}d`;
    return date.toLocaleDateString();
  };

  const { icon, bg, border } = getNotificationDetails();
  
  // Usamos el campo 'link' directo de la base de datos
  const targetLink = notification.link || '#';

  return (
    <li>
      <button 
        onClick={() => onNotificationClick(notification.id, targetLink)} 
        className={`w-full text-left flex items-start p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 relative ${!notification.is_read ? 'bg-indigo-50/20' : ''}`}
      >
        {/* Punto azul de "No leído" */}
        {!notification.is_read && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
        )}

        <div className={`shrink-0 w-10 h-10 ml-2 rounded-full flex items-center justify-center border shadow-sm ${bg} ${border}`}>
            {icon}
        </div>
        
        <div className="ml-3 flex-1 min-w-0 pr-2">
          {/* Título de la notificación */}
          <p className="text-xs font-bold text-slate-900 mb-0.5">
             {notification.title}
          </p>
          {/* Mensaje descriptivo con el remitente */}
          <p className="text-xs text-slate-600 leading-snug line-clamp-2">
             <span className="font-semibold text-slate-800">{notification.sender_name}</span> {notification.message}
          </p>
          {/* Tiempo transcurrido */}
          <p className="text-[10px] text-slate-400 mt-1.5 font-medium uppercase tracking-wider">
             {formatTimeAgo(notification.created_at)}
          </p>
        </div>
      </button>
    </li>
  );
};

const NotificationsDropdown = ({ notifications = [], onNotificationClick, onMarkAllAsRead }) => {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 z-[100] animate-scale-in overflow-hidden font-sans origin-top-right">
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-slate-50/80 border-b border-slate-100 backdrop-blur-sm">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Notificaciones 
            {unreadCount > 0 && <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">{unreadCount} nuevas</span>}
        </h3>
        {unreadCount > 0 && (
          <button onClick={onMarkAllAsRead} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider transition-colors bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg">
            Marcar leídas
          </button>
        )}
      </div>

      {/* Lista Scrollable */}
      <ul className="max-h-[400px] overflow-y-auto custom-scrollbar bg-white divide-y divide-slate-50">
        {notifications.length > 0 ? (
          notifications.map(notif => (
            <NotificationItem 
                key={notif.id} 
                notification={notif} 
                onNotificationClick={onNotificationClick} 
            />
          ))
        ) : (
          /* Estado Vacío */
          <li className="py-16 px-6 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-100 shadow-sm">
                <FaBellSlash className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-700">Todo al día</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[220px]">No tienes tareas pendientes ni avisos nuevos por revisar.</p>
            </div>
          </li>
        )}
      </ul>
      
      {/* Footer */}
      {notifications.length > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mostrando las últimas 20</span>
          </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;