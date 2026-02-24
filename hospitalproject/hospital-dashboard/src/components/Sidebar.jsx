import { LayoutDashboard, AlertCircle, Bed, Ambulance, Users, LogOut, ChevronLeft, ChevronRight, Settings, Calendar } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import NotificationContext from '../context/NotificationContext';
import Branding from './Branding';

const Sidebar = ({ isCollapsed, onToggle }) => {
    const { logout, user } = useContext(AuthContext);
    const { unreadAppointments, unreadEmergencies } = useContext(NotificationContext);

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/', color: 'blue' },
        { icon: AlertCircle, label: 'Emergency Requests', path: '/emergency', color: 'red', badge: unreadEmergencies },
        { icon: Bed, label: 'Bed Management', path: '/beds', color: 'blue' },
        { icon: Ambulance, label: 'Ambulance Control', path: '/ambulances', color: 'blue' },
        { icon: Users, label: 'Queue Manager', path: '/queue', color: 'blue' },
        { icon: Calendar, label: 'Appointments', path: '/appointments', color: 'blue', badge: unreadAppointments },
        { icon: Settings, label: 'Settings', path: '/settings', color: 'blue' },
    ];

    const filteredItems = navItems;

    return (
        <aside className={`transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-[260px]'} h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-20 shadow-xl shadow-gray-200/20`}>
            <div className={`p-6 border-b border-gray-50 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {isCollapsed && (
                    <div title="CuraNode" className="w-10 h-10 bg-gradient-to-br from-[#6FA3B3] to-[#4F8C9D] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#EAF3F6] cursor-default">
                        C
                    </div>
                )}
                {!isCollapsed && (
                    <Branding size="lg" />
                )}
            </div>

            <nav className="flex-1 p-4 space-y-1.5 overflow-hidden">
                {filteredItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        title={isCollapsed ? item.label : ''}
                        className={({ isActive }) => {
                            const baseClasses = `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 relative`;
                            const colorClasses = item.color === 'red'
                                ? isActive ? 'bg-red-50 text-red-600 shadow-sm shadow-red-100/50' : 'text-gray-500 hover:bg-red-50 hover:text-red-600 group'
                                : isActive ? 'bg-[#EAF3F6] text-[#6FA3B3] shadow-sm shadow-[#EAF3F6]/50' : 'text-gray-500 hover:bg-[#EAF3F6] hover:text-[#4F8C9D] group';
                            return `${baseClasses} ${colorClasses}`;
                        }}
                    >
                        <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110`} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                        {item.badge > 0 && (
                            <span className={`absolute ${isCollapsed ? 'top-2 right-2' : 'right-3'} flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white shadow-lg animate-bounce`}>
                                {item.badge > 9 ? '9+' : item.badge}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-50 space-y-2">
                <button
                    onClick={onToggle}
                    className="flex items-center gap-3 px-3 py-3 w-full text-left text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-bold transition-all group"
                >
                    {isCollapsed ? <ChevronRight className="w-5 h-5 mx-auto group-hover:text-[#4F8C9D]" /> : (
                        <>
                            <ChevronLeft className="w-5 h-5" />
                            Collapse
                        </>
                    )}
                </button>
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-3 w-full text-left text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-all group"
                >
                    <LogOut className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isCollapsed ? 'mx-auto' : ''}`} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
