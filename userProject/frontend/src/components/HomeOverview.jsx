import React from 'react';
import { Siren, MapPin, Stethoscope, FileText, CalendarCheck, Activity, Heart, Thermometer } from 'lucide-react';

const HomeOverview = ({ onNavigate, user }) => {
    const cards = [
        { id: 'emergency', label: 'Emergency Access', icon: Siren, color: 'bg-lightBg text-primary border-primary', desc: 'Immediate Ambulance Dispatch' },
        { id: 'finder', label: 'Hospital Finder', icon: MapPin, color: 'bg-lightBg text-primary border-primary', desc: 'Locate Nearest Facility' },
        { id: 'symptoms', label: 'Symptom Checker', icon: Stethoscope, color: 'bg-lightBg text-primary border-primary', desc: 'AI-Powered Analysis' },
        { id: 'records', label: 'Health Records', icon: FileText, color: 'bg-lightBg text-primary border-primary', desc: 'Secure Document Storage' },
        { id: 'booking', label: 'Queue Booking', icon: CalendarCheck, color: 'bg-lightBg text-primary border-primary', desc: 'Skip the Waiting Room' },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary to-primaryDark rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Patient'}</h1>
                    <p className="text-white opacity-90 max-w-2xl">
                        Your health is our priority. Access emergency services, find top-rated hospitals, or check symptoms instantly.
                    </p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-12" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Heart Rate', val: '72 bpm', icon: Heart, color: 'text-primary bg-lightBg' },
                    { label: 'Temperature', val: '98.6°F', icon: Thermometer, color: 'text-primary bg-lightBg' },
                    { label: 'Activity', val: 'Active', icon: Activity, color: 'text-primary bg-lightBg' },
                    { label: 'Checkups', val: '2 Pending', icon: CalendarCheck, color: 'text-primary bg-lightBg' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-primary shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-darkText uppercase font-bold tracking-wider">{stat.label}</p>
                            <p className="text-lg font-bold text-darkText">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Feature Grid */}
            <div>
                <h2 className="text-xl font-bold text-darkText mb-4">Quick Access</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map(card => (
                        <button
                            key={card.id}
                            onClick={() => onNavigate(card.id)}
                            className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left group
                                ${card.color} border bg-white`}
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${card.color.replace('bg-', 'bg-opacity-20 ')}`}>
                                <card.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-lg font-bold mb-1 text-darkText">{card.label}</h3>
                            <p className="text-sm opacity-70 font-medium text-darkText">{card.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomeOverview;
