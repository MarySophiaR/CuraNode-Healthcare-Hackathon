import React from 'react';
import { Siren, MapPin, Stethoscope, FileText, CalendarCheck, Activity, Heart, Thermometer } from 'lucide-react';

const COLORS = {
    primary: '#6FA3B3',
    primaryDark: '#4F8C9D',
    lightBg: '#EAF3F6',
    softGray: '#F5F7F8',
    darkText: '#1F2D3D',
};

const HomeOverview = ({ onNavigate, user }) => {
    const cards = [
        { id: 'emergency', label: 'Emergency Access', icon: Siren, desc: 'Immediate Ambulance Dispatch' },
        { id: 'finder', label: 'Hospital Finder', icon: MapPin, desc: 'Locate Nearest Facility' },
        { id: 'symptoms', label: 'Symptom Checker', icon: Stethoscope, desc: 'AI-Powered Analysis' },
        { id: 'records', label: 'Health Records', icon: FileText, desc: 'Secure Document Storage' },
        { id: 'booking', label: 'Queue Booking', icon: CalendarCheck, desc: 'Skip the Waiting Room' },
    ];

    const stats = [
        { label: 'Heart Rate', val: '72 bpm', icon: Heart },
        { label: 'Temperature', val: '98.6°F', icon: Thermometer },
        { label: 'Activity', val: 'Active', icon: Activity },
        { label: 'Checkups', val: '2 Pending', icon: CalendarCheck },
    ];

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Welcome Banner */}
            <div style={{
                background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primaryDark})`,
                borderRadius: '1.5rem',
                padding: '2rem',
                color: '#fff',
                marginBottom: '2rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(111,163,179,0.3)'
            }}>
                <div style={{ position: 'absolute', right: 0, top: 0, width: '30%', height: '100%', background: 'rgba(255,255,255,0.1)', transform: 'skewX(12deg) translateX(48px)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        Welcome back, {user?.name || 'Patient'} 👋
                    </h1>
                    <p style={{ opacity: 0.9, fontWeight: 500 }}>
                        Your health is our priority. Access emergency services, find top-rated hospitals, or check symptoms instantly.
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {stats.map((stat, i) => (
                    <div key={i} style={{
                        background: '#fff',
                        borderRadius: '1rem',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        border: `1px solid ${COLORS.lightBg}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                        <div style={{ background: COLORS.lightBg, borderRadius: '0.75rem', padding: '0.75rem', color: COLORS.primary }}>
                            <stat.icon size={22} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.65rem', color: COLORS.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: COLORS.darkText }}>{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Access Grid */}
            <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: COLORS.darkText, marginBottom: '1rem' }}>Quick Access</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {cards.map(card => (
                        <button
                            key={card.id}
                            onClick={() => onNavigate(card.id)}
                            style={{
                                background: '#fff',
                                border: `1px solid ${COLORS.lightBg}`,
                                borderRadius: '1.25rem',
                                padding: '1.5rem',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                color: COLORS.darkText,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.boxShadow = `0 8px 24px rgba(111,163,179,0.2)`;
                                e.currentTarget.style.borderColor = COLORS.primary;
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.color = COLORS.darkText;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                e.currentTarget.style.borderColor = COLORS.lightBg;
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.color = COLORS.darkText;
                            }}
                        >
                            <div style={{
                                width: '3rem', height: '3rem', borderRadius: '50%',
                                background: COLORS.lightBg, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', marginBottom: '1rem', color: COLORS.primary
                            }}>
                                <card.icon size={22} />
                            </div>
                            <h3 style={{ fontWeight: 700, color: COLORS.darkText, marginBottom: '0.25rem' }}>{card.label}</h3>
                            <p style={{ fontSize: '0.8rem', color: '#888', fontWeight: 500 }}>{card.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomeOverview;
