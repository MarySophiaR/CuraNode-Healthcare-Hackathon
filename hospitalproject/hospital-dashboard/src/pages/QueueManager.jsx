import { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import { Users, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { io } from 'socket.io-client';

const QueueManager = () => {
    const { user } = useContext(AuthContext);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = async () => {
        try {
            const { data } = await API.get('/hospital/me');
            if (data.waitingQueue) {
                // Sort by severity (desc) then joinedAt (asc)
                const sorted = [...data.waitingQueue].sort((a, b) => {
                    if (b.severity !== a.severity) return b.severity - a.severity;
                    return new Date(a.joinedAt) - new Date(b.joinedAt);
                });
                setQueue(sorted);
            }
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch queue', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();

        const socket = io('http://localhost:5000');
        socket.on('connect', () => {
            if (user?._id) socket.emit('registerHospital', user._id);
        });

        socket.on('queueUpdated', (data) => {
            if (data.hospitalId === user?._id) {
                console.log('Queue updated', data.queue);
                const sorted = [...data.queue].sort((a, b) => {
                    if (b.severity !== a.severity) return b.severity - a.severity;
                    return new Date(a.joinedAt) - new Date(b.joinedAt);
                });
                setQueue(sorted);
            }
        });

        socket.on('hospitalUpdate', fetchQueue); // Re-fetch on resource changes too

        return () => socket.disconnect();
    }, [user?._id]);

    const handleForceAssign = async (emergencyId) => {
        try {
            await API.post(`/hospital/queue/${emergencyId}/assign`);
            // Optimistic update
            setQueue(prev => prev.filter(item => item.emergencyId !== emergencyId));
        } catch (error) {
            console.error('Failed to force assign', error);
            alert('Failed to assign. Check resources.');
        }
    };

    // Helper for wait time
    const WaitTimer = ({ joinedAt }) => {
        const [wait, setWait] = useState('');

        useEffect(() => {
            const update = () => {
                const diff = Math.floor((new Date() - new Date(joinedAt)) / 1000);
                const m = Math.floor(diff / 60);
                const s = diff % 60;
                setWait(`${m}m ${s}s`);
            };
            update();
            const interval = setInterval(update, 1000);
            return () => clearInterval(interval);
        }, [joinedAt]);

        return <span>{wait}</span>;
    };

    const getSeverityColor = (severity) => {
        if (severity >= 4) return 'bg-red-100 text-red-800 border-red-200';
        if (severity === 3) return 'bg-orange-100 text-orange-800 border-orange-200';
        return 'bg-green-100 text-green-800 border-green-200';
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading queue...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Users className="text-[#6FA3B3]" />
                Patient Queue Manager
            </h1>

            {queue.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No patients currently waiting</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Waiting List</span>
                        <span className="bg-[#EAF3F6] text-[#6FA3B3] text-xs font-bold px-2 py-1 rounded-full">
                            {queue.length} Waiting
                        </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {queue.map((item, index) => (
                            <div key={item.emergencyId} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center justify-center w-10 h-10 bg-gray-100 rounded-full font-bold text-gray-500 text-sm">
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900">Emergency {String(item.emergencyId).slice(-6)}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(item.severity)}`}>
                                                Severity {item.severity}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Wait: <WaitTimer joinedAt={item.joinedAt} />
                                            </div>
                                            {index === 0 && (
                                                <div className="flex items-center gap-1 text-[#6FA3B3] font-medium">
                                                    <ArrowRight className="w-3 h-3" />
                                                    Next in line
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleForceAssign(item.emergencyId)}
                                    className="px-4 py-2 border border-[#6FA3B3]/30 text-[#6FA3B3] hover:bg-[#EAF3F6] rounded-lg text-sm font-medium transition-colors"
                                >
                                    Force Assign
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QueueManager;
