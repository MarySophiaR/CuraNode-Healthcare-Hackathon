import Sidebar from '../components/Sidebar';
import { Outlet, Link } from 'react-router-dom';
import { useContext, useState } from 'react';
import AuthContext from '../context/AuthContext';
import { User, Bell } from 'lucide-react';
import Branding from '../components/Branding';
import NotificationCenter from '../components/NotificationCenter';

const DashboardLayout = () => {
    const { user } = useContext(AuthContext);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-[#EAF3F6]">
            <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

            <main className={`transition-all duration-300 ${isSidebarCollapsed ? 'ml-[80px]' : 'ml-[260px]'} min-h-screen flex flex-col`}>
                {/* Top Navbar */}
                <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm shadow-gray-100/50">
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                            Overview
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 border-l border-gray-100 pl-6">
                            <NotificationCenter />

                            <button className="ml-2 flex items-center gap-2 pl-2 pr-1 py-1 bg-gray-50 rounded-full border border-gray-100 hover:bg-gray-100 transition-all group">
                                <div className="w-8 h-8 rounded-full bg-[#6FA3B3] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#EAF3F6]">
                                    {user?.hospitalName?.split(' ').pop()?.charAt(0).toUpperCase() || 'H'}
                                </div>
                                <User className="w-4 h-4 text-gray-400 group-hover:text-gray-600 mr-2" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* content */}
                <div className="p-8 flex-1">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
