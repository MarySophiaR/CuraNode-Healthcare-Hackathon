import { createContext, useState, useEffect, useContext } from 'react';
import SocketContext from './SocketContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { socket } = useContext(SocketContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadAppointments, setUnreadAppointments] = useState(0);
    const [unreadEmergencies, setUnreadEmergencies] = useState(0);

    const addNotification = (notif) => {
        const id = Date.now() + Math.random();
        const newNotif = { ...notif, id };
        setNotifications(prev => [newNotif, ...prev]);

        if (notif.type === 'appointment') setUnreadAppointments(prev => prev + 1);
        if (notif.type === 'emergency') setUnreadEmergencies(prev => prev + 1);

        // Auto-remove after 30 seconds
        setTimeout(() => removeNotification(id), 30000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAppointmentsCount = () => setUnreadAppointments(0);
    const clearEmergenciesCount = () => setUnreadEmergencies(0);

    useEffect(() => {
        if (!socket) return;

        socket.on('newAppointment', (data) => {
            const { appointment } = data;
            addNotification({
                type: 'appointment',
                title: 'New Appointment Booked',
                message: `${appointment.patientName} (${appointment.patientAge}y, ${appointment.category}) booked ${appointment.serviceType}`,
                path: '/appointments',
                color: 'bg-green-50 text-green-600 border-green-100',
                data: appointment
            });
        });

        return () => {
            socket.off('newAppointment');
        };
    }, [socket]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadAppointments,
            unreadEmergencies,
            removeNotification,
            clearAppointmentsCount,
            clearEmergenciesCount
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
