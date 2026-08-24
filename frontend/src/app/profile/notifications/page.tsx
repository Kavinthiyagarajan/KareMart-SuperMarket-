"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { api, NotificationDto } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotificationsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    
    fetchNotifications();
  }, [token, router]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications(0, 50);
      setNotifications(res.content);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading notifications...</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden min-h-full flex flex-col">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900">Notifications</h3>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllAsRead} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1">
      {notifications.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">You're all caught up.</h3>
          <p className="text-slate-500">You don't have any notifications right now.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-5 flex gap-4 ${!notif.read ? 'bg-emerald-50/50' : ''}`}
            >
              <div className="mt-1">
                {!notif.read ? (
                  <span className="flex w-3 h-3 bg-emerald-500 rounded-full"></span>
                ) : (
                  <span className="flex w-3 h-3 bg-slate-200 rounded-full"></span>
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>
                  {notif.title}
                </h4>
                <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
                  <span>{new Date(notif.createdAt).toLocaleString()}</span>
                  
                  {notif.orderNumber && (
                    <Link 
                      href={`/profile/orders/${notif.orderNumber}`}
                      className="text-emerald-600 hover:text-emerald-700 font-bold"
                    >
                      View Order
                    </Link>
                  )}
                  
                  {!notif.read && (
                    <button 
                      onClick={() => markAsRead(notif.id)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
