import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    Siren, MapPin, Stethoscope, FileText, CalendarCheck,
    User, LogOut, ChevronLeft, ChevronRight, LayoutDashboard, Settings, Home
} from 'lucide-react';

import EmergencyPage from './EmergencyPage';
import HospitalsPage from './HospitalsPage';
import SymptomChecker from './SymptomChecker';
import HealthRecords from './HealthRecords';
import QueueBooking from './QueueBooking';
import HomeOverview from './HomeOverview';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('userInfo'));

    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    if (!user) return null;

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/');
    };

    const menuItems = [
        { id: 'home', label: 'Dashboard', icon: Home, color: 'text-primary' },
        { id: 'emergency', label: 'Emergency', icon: Siren, color: 'text-primary' },
        { id: 'finder', label: 'Hospitals', icon: MapPin, color: 'text-primary' },
        { id: 'symptoms', label: 'Symptoms', icon: Stethoscope, color: 'text-primary' },
        { id: 'records', label: 'Records', icon: FileText, color: 'text-primary' },
        { id: 'booking', label: 'Bookings', icon: CalendarCheck, color: 'text-primary' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <HomeOverview user={user} onNavigate={setActiveTab} />;
            case 'emergency': return <EmergencyPage />;
            case 'finder': return <HospitalsPage onBook={() => setActiveTab('booking')} />;
            case 'symptoms': return <SymptomChecker />;
            case 'records': return <HealthRecords />;
            case 'booking': return <QueueBooking />;
            default: return <HomeOverview user={user} onNavigate={setActiveTab} />;
        }
    };

    return (
        <div className="flex h-screen bg-softGray text-darkText font-sans overflow-hidden">

            {/* Sidebar */}
            <aside
                className={`relative bg-white border-r border-primary flex flex-col transition-all duration-300 ease-in-out z-20 shadow-sm
                ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
            >
                {/* Header */}
                <div className="h-16 flex items-center px-6 border-b border-primary">
                    <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                            <Siren className="w-5 h-5 text-white" />
                        </div>
                        <span className={`font-bold text-lg tracking-tight transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                            CuraNode
                        </span>
                    </div>
                </div>

                {/* User Info (Compact) */}
                <div className="p-4 border-b border-primary">
                    <div className={`bg-softGray rounded-lg p-2 flex items-center gap-3 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-darkText truncate">{user.name}</p>
                                <p className="text-xs text-darkText truncate">Patient</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                            ${activeTab === item.id
                                    ? 'bg-softGray text-darkText shadow-sm'
                                    : 'text-darkText hover:bg-softGray hover:text-darkText'
                                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                            title={isSidebarCollapsed ? item.label : ''}
                        >
                            <item.icon className={`w-5 h-5 ${activeTab === item.id ? item.color : 'text-darkText'}`} />
                            <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>

                {/* Footer Controls */}
                <div className="p-4 border-t border-primary space-y-2">
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-darkText hover:text-darkText rounded-lg hover:bg-softGray transition-colors"
                    >
                        {isSidebarCollapsed ? <ChevronRight className="w-5 h-5 ml-0.5" /> : <><ChevronLeft className="w-5 h-5" /> <span>Collapse</span></>}
                    </button>

                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-primary hover:bg-primary rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut className="w-5 h-5" />
                        {!isSidebarCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-white/50 relative">
                <header className="h-16 bg-white border-b border-primary px-8 flex items-center justify-between shadow-sm z-10">
                    <h1 className="text-xl font-semibold text-darkText tracking-tight flex items-center gap-2">
                        {menuItems.find(i => i.id === activeTab)?.icon && React.createElement(menuItems.find(i => i.id === activeTab).icon, { className: `w-5 h-5 ${menuItems.find(i => i.id === activeTab).color}` })}
                        {menuItems.find(i => i.id === activeTab)?.label}
                    </h1>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-darkText hover:text-darkText transition-colors rounded-full hover:bg-softGray">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-0 scroll-smooth">
                    {renderContent()}
                </div>
            </main>

        </div>
    );
};

export default Dashboard;
