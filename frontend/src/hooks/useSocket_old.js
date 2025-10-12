import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection with credentials
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event listeners
    newSocket.on('connect', () => {
      console.log('✅ Connected to notification server');
      setConnected(true);
    });

    newSocket.on('connected', (data) => {
      console.log('Server confirmation:', data);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from notification server');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Listen for new notifications
    newSocket.on('notification', (notification) => {
      console.log('📬 New notification:', notification);
      setNotifications((prev) => [notification, ...prev]);
      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    // Listen for notifications list
    newSocket.on('notifications-list', (notificationsList) => {
      setNotifications(notificationsList);
      const unread = notificationsList.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    });

    // Listen for read confirmation
    newSocket.on('notification-read', ({ notificationId }) => {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Helper functions
  const markAsRead = (notificationId) => {
    if (socketRef.current) {
      socketRef.current.emit('mark-read', notificationId);
    }
  };

  const getNotifications = (limit = 20, skip = 0) => {
    if (socketRef.current) {
      socketRef.current.emit('get-notifications', { limit, skip });
    }
  };

  return {
    socket,
    connected,
    notifications,
    unreadCount,
    setNotifications,
    setUnreadCount,
    markAsRead,
    getNotifications,
  };
};
