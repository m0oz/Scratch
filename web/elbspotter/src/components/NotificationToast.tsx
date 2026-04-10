import { useEffect, useState } from 'react';
import { AppNotification } from '../types';

interface Props {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}

function Toast({ notification, onDismiss }: { notification: AppNotification; onDismiss: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLeaving(true);
      setTimeout(onDismiss, 300);
    }, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isShip = notification.type === 'ship';

  return (
    <div
      className={`flex items-start gap-3 p-3 pr-4 rounded-2xl border shadow-lg cursor-pointer transition-all duration-300 ${
        leaving ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      } ${
        isShip
          ? 'bg-white border-ship-amber/60 shadow-ship/20'
          : 'bg-white border-beluga-teal/60 shadow-beluga/20'
      }`}
      onClick={() => { setLeaving(true); setTimeout(onDismiss, 300); }}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
        isShip ? 'bg-ship-pale' : 'bg-beluga-pale'
      }`}>
        {isShip ? '🚢' : '🐋'}
      </div>
      <div className="min-w-0">
        <div className={`font-bold text-sm ${isShip ? 'text-ship-dark' : 'text-beluga-dark'}`}>
          {notification.title}
        </div>
        <div className="text-xs text-muted mt-0.5 leading-snug">{notification.message}</div>
      </div>
      <button
        className="ml-auto text-gray-300 hover:text-gray-500 text-xs shrink-0 self-start transition-colors pt-0.5"
        onClick={(e) => { e.stopPropagation(); setLeaving(true); setTimeout(onDismiss, 300); }}
      >
        ✕
      </button>
    </div>
  );
}

export function NotificationToast({ notifications, onDismiss }: Props) {
  const visible = notifications.filter((n) => !n.dismissed);
  if (visible.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      {visible.slice(0, 4).map((n) => (
        <Toast key={n.id} notification={n} onDismiss={() => onDismiss(n.id)} />
      ))}
    </div>
  );
}
