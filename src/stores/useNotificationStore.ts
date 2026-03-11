import { create } from 'zustand';

export interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    unreadCount: 0,

    addNotification: (notification) => set((state) => {
        const newNotif: Notification = {
            ...notification,
            id: Math.random().toString(36).substring(7),
            isRead: false,
            createdAt: new Date(),
        };

        return {
            notifications: [newNotif, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        };
    }),

    markAsRead: (id) => set((state) => {
        const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
        );

        return {
            notifications: updated,
            unreadCount: updated.filter(n => !n.isRead).length,
        };
    }),

    markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
    })),

    clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
