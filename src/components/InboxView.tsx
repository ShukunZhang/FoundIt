import React from 'react';
import { 
  Bell, 
  CreditCard, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Heart, 
  ArrowRight, 
  CheckCheck,
  QrCode
} from 'lucide-react';
import { NotificationItem } from '../types';

interface InboxViewProps {
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onNotificationAction: (notif: NotificationItem) => void;
  onShowPickupCode: (code: string, itemTitle: string, deskName: string) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  notifications,
  onMarkAllAsRead,
  onNotificationAction,
  onShowPickupCode,
}) => {
  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'watcard_found':
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case 'claim_approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'match_alert':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case 'expiring_soon':
        return <Clock className="w-4 h-4 text-rose-500" />;
      case 'dropoff_thanks':
        return <Heart className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const getBg = (type: NotificationItem['type']) => {
    switch (type) {
      case 'watcard_found':
        return 'bg-amber-100 border-amber-300';
      case 'claim_approved':
        return 'bg-emerald-100 border-emerald-300';
      case 'match_alert':
        return 'bg-amber-50 border-amber-200';
      case 'expiring_soon':
        return 'bg-rose-50 border-rose-200';
      case 'dropoff_thanks':
        return 'bg-pink-50 border-pink-200';
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12 animate-fade-in">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Inbox Notifications</h2>
          <p className="text-xs text-slate-500">
            Real-time updates regarding WatCard sightings, claim reviews, and matches.
          </p>
        </div>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-950 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 p-8 space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No notifications yet</h3>
          <p className="text-xs text-slate-500">
            When staff log a matching item or approve your claims, updates will arrive here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all ${
                notif.read
                  ? 'bg-white border-slate-200/80 text-slate-700'
                  : 'bg-amber-50/40 border-amber-300/80 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getBg(
                    notif.type
                  )}`}
                >
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {notif.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {notif.message}
                  </p>

                  {/* Contextual Action Button */}
                  <div className="flex items-center gap-2">
                    {notif.pickupCode && (
                      <button
                        onClick={() =>
                          onShowPickupCode(
                            notif.pickupCode!,
                            notif.title,
                            'Assigned Desk'
                          )
                        }
                        className="py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Show QR Pass ({notif.pickupCode})</span>
                      </button>
                    )}

                    {notif.actionText && (
                      <button
                        onClick={() => onNotificationAction(notif)}
                        className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <span>{notif.actionText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
