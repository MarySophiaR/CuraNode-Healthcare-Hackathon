import { useState, useContext } from 'react';
import NotificationContext from '../context/NotificationContext';
import { AlertCircle, Bell, Ambulance, X, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotificationCenter = () => {
    const { notifications, removeNotification } = useContext(NotificationContext);
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-400 hover:text-[#4F8C9D] hover:bg-[#EAF3F6] rounded-lg transition-all"
            >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden">
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Notifications</span>
                        <button onClick={() => { }} className="text-xs text-gray-400 hover:text-gray-600 font-bold opacity-50 cursor-not-allowed">Clear All</button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center text-gray-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No new alerts</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <Link
                                    key={n.id}
                                    to={n.path}
                                    onClick={() => setShowDropdown(false)}
                                    className={`block p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${n.color.split(' ')[0]}`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.color.split(' ').slice(0, 2).join(' ')}`}>
                                            {n.type === 'emergency' ? <AlertCircle className="w-5 h-5" /> : (n.type === 'appointment' ? <Bell className="w-5 h-5" /> : <Ambulance className="w-5 h-5" />)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{n.title}</p>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-2 font-medium">Just now</p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Floating Toast Notification for Immediate Alert */}
            <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 pointer-events-none">
                {notifications.slice(0, 3).map(n => (
                    <div
                        key={n.id}
                        className={`pointer-events-auto bg-white border ${n.color.split(' ')[2]} rounded-2xl shadow-2xl p-4 w-72 flex gap-3 animate-slide-up transform hover:scale-102 transition-all`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.color.split(' ').slice(0, 2).join(' ')}`}>
                            {n.type === 'emergency' ? <AlertCircle className="w-5 h-5" /> : (n.type === 'appointment' ? <Bell className="w-5 h-5" /> : <Ambulance className="w-5 h-5" />)}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 leading-tight">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                            <div className="mt-3 flex gap-2">
                                <Link
                                    to={n.path}
                                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${n.color.split(' ').slice(0, 2).join(' ')}`}
                                >
                                    View Details
                                </Link>
                                <button
                                    onClick={(e) => { e.preventDefault(); removeNotification(n.id); }}
                                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up { animation: slide-up 0.3s ease-out; }
                .scale-102:hover { transform: scale(1.02); }
            `}</style>
        </div>
    );
};

export default NotificationCenter;
