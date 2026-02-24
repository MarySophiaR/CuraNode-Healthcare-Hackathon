import { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, XCircle, ChevronRight, Filter } from 'lucide-react';
import NotificationContext from '../context/NotificationContext';
import SocketContext from '../context/SocketContext';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, confirmed, cancelled
    const { clearAppointmentsCount } = useContext(NotificationContext);
    const { socket } = useContext(SocketContext);

    const fetchAppointments = async () => {
        try {
            const { data } = await API.get('/appointments');
            setAppointments(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch appointments', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
        clearAppointmentsCount();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('newAppointment', () => {
            fetchAppointments();
        });

        return () => {
            socket.off('newAppointment');
        };
    }, [socket]);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await API.patch(`/appointments/${id}/status`, { status: newStatus });
            setAppointments(prev => prev.map(app =>
                app._id === id ? { ...app, status: newStatus } : app
            ));
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-50 text-green-600 border-green-100';
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
            case 'completed': return 'bg-[#EAF3F6] text-[#6FA3B3] border-[#6FA3B3]/20';
            default: return 'bg-orange-50 text-orange-600 border-orange-100';
        }
    };

    const filteredAppointments = appointments.filter(app =>
        filter === 'all' ? true : app.status === filter
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading appointments...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="text-[#6FA3B3]" />
                        Patient Appointments
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and track upcoming hospital visits.</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-[#6FA3B3] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'pending' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('confirmed')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'confirmed' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Confirmed
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredAppointments.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                        <h3 className="text-lg font-bold text-gray-700">No appointments found</h3>
                        <p className="text-gray-400 max-w-xs mx-auto mt-1">There are currently no {filter !== 'all' ? filter : ''} appointments to display.</p>
                    </div>
                ) : (
                    filteredAppointments.map((app) => (
                        <div key={app._id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                {/* Patient Info */}
                                <div className="flex items-center gap-4 min-w-[240px]">
                                    <div className="w-12 h-12 bg-[#EAF3F6] rounded-full flex items-center justify-center text-[#6FA3B3] flex-shrink-0">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{app.patientName}</h3>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            {app.patientAge} Years • {app.category}
                                        </p>
                                    </div>
                                </div>

                                {/* Appointment Details */}
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 border-l border-gray-50 lg:pl-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registration Date</p>
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Calendar className="w-4 h-4 text-[#6FA3B3]" />
                                            {new Date(app.createdAt).toLocaleDateString()}
                                            <Clock className="w-4 h-4 text-[#6FA3B3] ml-1" />
                                            {new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Department</p>
                                        <div className="text-sm font-medium text-gray-700">
                                            {app.serviceType}
                                        </div>
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusStyles(app.status)}`}>
                                            {app.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 lg:border-l border-gray-50 lg:pl-6">
                                    {app.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(app._id, 'confirmed')}
                                                className="flex-1 lg:flex-none px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(app._id, 'cancelled')}
                                                className="flex-1 lg:flex-none px-4 py-2 bg-white border border-gray-200 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 hover:border-red-200 transition-all"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                    {app.status === 'confirmed' && (
                                        <button
                                            onClick={() => handleUpdateStatus(app._id, 'completed')}
                                            className="w-full lg:w-auto px-4 py-2 bg-[#6FA3B3] text-white text-sm font-bold rounded-xl hover:bg-[#4F8C9D] transition-all"
                                        >
                                            Complete Visit
                                        </button>
                                    )}
                                    {(app.status === 'completed' || app.status === 'cancelled') && (
                                        <div className={`text-xs font-bold flex items-center gap-2 ${app.status === 'completed' ? 'text-[#6FA3B3]' : 'text-gray-400'}`}>
                                            {app.status === 'completed' ? 'Processed' : 'Archived'}
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Appointments;
