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

        socket.on('new_emergency', (data) => {
            addNotification({
                type: 'emergency',
                title: '🆘 CRITICAL EMERGENCY',
                message: `Immediate action required! Severity Level: ${data.severity}`,
                path: '/emergency',
                color: 'bg-red-600 text-white border-red-700 font-bold',
                data
            });
        });

        socket.on('emergencyRequest', (data) => {
            addNotification({
                type: 'emergency',
                title: 'New Emergency Request',
                message: `Incoming ${data.severity >= 5 ? 'Critical' : 'High'} request from ${data.userLocation || 'Nearby Area'}`,
                path: '/emergency',
                color: 'bg-red-50 text-red-600 border-red-100',
                data
            });
        });

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

        socket.on('ambulanceLocationUpdate', (data) => {
            if (data.progress === 90) {
                addNotification({
                    type: 'tracking',
                    title: 'Ambulance Update',
                    message: `Ambulance for Emergency #${String(data.emergencyId).slice(-6)} is approaching destination.`,
                    path: '/ambulances',
                    color: 'bg-[#EAF3F6] text-[#6FA3B3] border-[#6FA3B3]/20'
                });
            }
        });

        socket.on('ambulanceStatus', (data) => {
            if (data.status === 'arrived') {
                addNotification({
                    type: 'emergency',
                    title: 'Ambulance Arrived',
                    message: `Ambulance for Emergency #${String(data.emergencyId).slice(-6)} has reached the patient.`,
                    path: '/ambulances',
                    color: 'bg-green-50 text-green-600 border-green-100',
                    data
                });
            }
        });

        return () => {
            socket.off('emergencyRequest');
            socket.off('newAppointment');
            socket.off('ambulanceLocationUpdate');
            socket.off('ambulanceStatus');
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
