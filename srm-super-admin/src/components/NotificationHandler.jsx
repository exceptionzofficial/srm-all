import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare } from 'react-icons/fi';
import { getUserGroups } from '../services/api';

const NotificationHandler = () => {
    const [user, setUser] = useState(null);
    const [notification, setNotification] = useState(null);
    const lastCheckedTimeRef = useRef(Date.now());
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse user', e);
            }
        }
    }, []);

    useEffect(() => {
        if (!user || !user.employeeId) return;

        checkNewMessages();
        const chatInterval = setInterval(checkNewMessages, 10000);

        return () => clearInterval(chatInterval);
    }, [user]);

    // ... (removed test notification)

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const checkNewMessages = async () => {
        if (!user || !user.employeeId) return;

        try {
            const response = await getUserGroups(user.employeeId);
            if (response.success && response.data) {
                const newMessages = response.data.filter(g => {
                    let updatedTime = g.updatedAt;
                    if (updatedTime && typeof updatedTime === 'object' && updatedTime._seconds) {
                        updatedTime = updatedTime._seconds * 1000;
                    } else if (typeof updatedTime === 'string') {
                        updatedTime = new Date(updatedTime).getTime();
                    }

                    const activeGroupId = sessionStorage.getItem('ADMIN_ACTIVE_GROUP');
                    const isNew = updatedTime > lastCheckedTimeRef.current;
                    // Check if I am the sender (prevent notifying my own messages)
                    const notMe = g.lastMessageSender !== 'Super Admin' && g.lastMessageSender !== user.name;
                    const notActive = String(g.id) !== String(activeGroupId);

                    return isNew && g.lastMessageSender && notMe && notActive;
                });

                if (newMessages.length > 0) {
                    const lastGroup = newMessages[0];
                    setNotification({
                        message: `New message in ${lastGroup.name}: ${lastGroup.lastMessage}`,
                        type: 'info',
                        groupId: lastGroup.id
                    });
                    lastCheckedTimeRef.current = Date.now();
                }
            }
        } catch (error) {
            // Silently fail or log only once to avoid spam
            if (error.response?.status !== 500) { // Don't log expected server errors if 500 is known issue
                console.warn('Polling error:', error.message);
            }
        }
    };

    const handleNotificationClick = () => {
        if (notification?.groupId) {
            navigate('/chat', { state: { groupId: notification.groupId } });
            setNotification(null);
        }
    };

    if (!notification) return null;

    return (
        <div
            className="notification-toast"
            onClick={handleNotificationClick}
            style={{ cursor: notification.groupId ? 'pointer' : 'default' }}
        >
            <div className="toast-content">
                <FiMessageSquare className="toast-icon" />
                <span>{notification.message}</span>
            </div>
            <button className="toast-close" onClick={(e) => { e.stopPropagation(); setNotification(null); }}>×</button>
        </div>
    );
};

export default NotificationHandler;
