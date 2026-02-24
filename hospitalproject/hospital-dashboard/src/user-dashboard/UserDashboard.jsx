import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Siren, MapPin, Stethoscope, FileText, CalendarCheck,
    LogOut, ChevronLeft, ChevronRight, Settings, Home,
    X, Calendar, Clock, User, Phone, Mail, MessageSquare, CheckCircle2, Loader2
} from 'lucide-react';

import EmergencyPage from './EmergencyPage';
import HospitalsPage from './HospitalsPage';
import SymptomChecker from './SymptomChecker';
import HealthRecords from './HealthRecords';
import QueueBooking from './QueueBooking';
import HomeOverview from './HomeOverview';
import AuthContext from '../context/AuthContext';
import API from '../services/api';

const C = {
    primary: '#6FA3B3',
    primaryDark: '#4F8C9D',
    lightBg: '#EAF3F6',
    softGray: '#F5F7F8',
    darkText: '#1F2D3D',
    white: '#ffffff',
};

const menuItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'emergency', label: 'Emergency', icon: Siren },
    { id: 'finder', label: 'Hospitals', icon: MapPin },
    { id: 'symptoms', label: 'Symptoms', icon: Stethoscope },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'booking', label: 'Bookings', icon: CalendarCheck },
];

const AppointmentModal = ({ show, onClose, hospital, user }) => {
    const [formData, setFormData] = useState({
        patientName: user?.name || '',
        patientAge: '',
        appointmentDate: new Date().toISOString().split('T')[0],
        serviceType: 'General Consultation',
        category: 'Normal'
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (user?.name) setFormData(prev => ({ ...prev, patientName: user.name }));
    }, [user]);

    if (!show || !hospital) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.post('/appointments', {
                hospitalId: hospital._id || hospital.id,
                patientName: formData.patientName,
                patientAge: formData.patientAge,
                appointmentDate: formData.appointmentDate,
                serviceType: formData.serviceType,
                category: formData.category
            });
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setFormData({ patientName: user?.name || '', patientAge: '', appointmentDate: new Date().toISOString().split('T')[0], serviceType: 'General Consultation', category: 'Normal' });
            }, 2000);
        } catch (error) {
            console.error('Booking failed', error);
            const msg = error.response?.data?.message || 'Failed to book appointment. Please try again.';
            const errDetail = error.response?.data?.error || '';
            alert(`${msg}${errDetail ? ` (${errDetail})` : ''}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: C.white, borderRadius: 24, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                {success ? (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                        <div style={{ width: 80, height: 80, background: '#D1FAE5', color: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <CheckCircle2 size={48} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.darkText, marginBottom: 8 }}>Booking Confirmed!</h2>
                        <p style={{ color: '#6B7280', fontWeight: 500 }}>Your request at {hospital.name} has been sent.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ background: C.primary, padding: '24px 32px', color: C.white, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Register Appointment</h2>
                                <p style={{ fontSize: '0.85rem', opacity: 0.9, margin: '4px 0 0 0' }}>{hospital.name}</p>
                            </div>
                            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: C.white, cursor: 'pointer', padding: 4 }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6B7280', display: 'block', marginBottom: 6 }}>PATIENT NAME</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: C.primary }} />
                                    <input
                                        type="text" required placeholder="Enter full name"
                                        value={formData.patientName}
                                        onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12, border: '1.5px solid #E5E7EB', outline: 'none', fontSize: '0.9rem', fontWeight: 600 }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6B7280', display: 'block', marginBottom: 6 }}>AGE</label>
                                    <input
                                        type="number" required placeholder="Age"
                                        value={formData.patientAge}
                                        onChange={e => setFormData({ ...formData, patientAge: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid #E5E7EB', outline: 'none', fontSize: '0.9rem', fontWeight: 600 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6B7280', display: 'block', marginBottom: 6 }}>CATEGORY</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid #E5E7EB', outline: 'none', fontSize: '0.9rem', fontWeight: 600, background: '#fff' }}
                                    >
                                        <option value="Normal">Normal</option>
                                        <option value="Elderly">Elderly</option>
                                        <option value="Pregnancy">Pregnancy</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6B7280', display: 'block', marginBottom: 6 }}>SERVICE TYPE</label>
                                <select
                                    value={formData.serviceType}
                                    onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid #E5E7EB', outline: 'none', fontSize: '0.9rem', fontWeight: 600, background: '#fff' }}
                                >
                                    <option>General Consultation</option>
                                    <option>Cardiology</option>
                                    <option>Neurology</option>
                                    <option>Orthopedics</option>
                                    <option>Pediatrics</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6B7280', display: 'block', marginBottom: 6 }}>APPOINTMENT DATE</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={16} style={{ position: 'absolute', left: 12, top: 12, color: C.primary }} />
                                    <input
                                        type="date" required
                                        value={formData.appointmentDate}
                                        onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12, border: '1.5px solid #E5E7EB', outline: 'none', fontSize: '0.9rem', fontWeight: 600 }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit" disabled={loading}
                                style={{
                                    width: '100%', padding: 14, background: C.primary, color: C.white,
                                    borderRadius: 12, border: 'none', fontWeight: 800, fontSize: '1rem',
                                    cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                                    marginTop: 8, boxShadow: '0 10px 15px -3px rgba(111,163,179,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                                }}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <CalendarCheck size={20} />}
                                {loading ? 'Processing...' : 'Confirm Appointment'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const UserDashboard = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [collapsed, setCollapsed] = useState(false);
    const [bookingHospital, setBookingHospital] = useState(null);
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);

    const handleLogout = () => { logout(); navigate('/login'); };

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <HomeOverview user={user} onNavigate={setActiveTab} />;
            case 'emergency': return <EmergencyPage />;
            case 'finder': return <HospitalsPage onBook={(h) => setBookingHospital(h)} />;
            case 'symptoms': return <SymptomChecker />;
            case 'records': return <HealthRecords />;
            case 'booking': return <QueueBooking />;
            default: return <HomeOverview user={user} onNavigate={setActiveTab} />;
        }
    };

    const activeItem = menuItems.find(i => i.id === activeTab);
    const sidebarW = collapsed ? 72 : 240;

    return (
        <div style={{ display: 'flex', height: '100vh', background: C.softGray, overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>

            {/* Sidebar */}
            <aside style={{
                width: sidebarW, flexShrink: 0,
                background: C.white,
                borderRight: `1.5px solid ${C.lightBg}`,
                display: 'flex', flexDirection: 'column',
                transition: 'width 0.25s ease',
                zIndex: 20, overflow: 'hidden',
            }}>
                {/* Brand */}
                <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 1.1rem', borderBottom: `1.5px solid ${C.lightBg}`, gap: '0.65rem', flexShrink: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Siren size={18} color="#fff" />
                    </div>
                    {!collapsed && <span style={{ fontWeight: 800, fontSize: '1.05rem', color: C.darkText, whiteSpace: 'nowrap' }}>CuraNode</span>}
                </div>

                {/* User Info */}
                <div style={{ padding: '0.85rem', borderBottom: `1.5px solid ${C.lightBg}`, flexShrink: 0 }}>
                    <div style={{ background: C.lightBg, borderRadius: '0.75rem', padding: '0.55rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                            {(user?.name || 'P').charAt(0).toUpperCase()}
                        </div>
                        {!collapsed && (
                            <div style={{ overflow: 'hidden' }}>
                                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: C.darkText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Patient'}</p>
                                <p style={{ fontSize: '0.7rem', color: C.primary, fontWeight: 600 }}>Patient</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '0.75rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
                    {menuItems.map(item => {
                        const active = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem',
                                    borderRadius: '0.6rem', border: 'none', background: active ? C.lightBg : 'transparent',
                                    color: active ? C.primary : '#666', fontWeight: active ? 700 : 500, fontSize: '0.85rem',
                                    cursor: 'pointer', transition: 'all 0.15s', justifyContent: collapsed ? 'center' : 'flex-start',
                                    textAlign: 'left', borderLeft: active ? `3px solid ${C.primary}` : '3px solid transparent',
                                }}
                            >
                                <item.icon size={18} color={active ? C.primary : '#888'} style={{ flexShrink: 0 }} />
                                {!collapsed && <span>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div style={{ padding: '0.75rem 0.6rem', borderTop: `1.5px solid ${C.lightBg}`, display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0 }}>
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '0.6rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#888', fontSize: '0.85rem', fontWeight: 500, width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Collapse</span></>}
                    </button>
                    <button
                        onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '0.6rem', border: 'none', background: 'transparent', cursor: 'pointer', color: C.primary, fontSize: '0.85rem', fontWeight: 600, width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}
                    >
                        <LogOut size={18} style={{ flexShrink: 0 }} />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <header style={{ height: 64, background: C.white, borderBottom: `1.5px solid ${C.lightBg}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', flexShrink: 0, boxShadow: '0 1px 4px rgba(111,163,179,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {activeItem && <activeItem.icon size={20} color={C.primary} />}
                        <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: C.darkText }}>{activeItem?.label}</h1>
                    </div>
                </header>

                <div style={{
                    flex: 1,
                    overflowY: (activeTab === 'emergency' || activeTab === 'finder') ? 'hidden' : 'auto',
                    display: (activeTab === 'emergency' || activeTab === 'finder') ? 'flex' : 'block',
                    flexDirection: 'column'
                }}>
                    {renderContent()}
                </div>
            </main>

            <AppointmentModal
                show={!!bookingHospital}
                onClose={() => setBookingHospital(null)}
                hospital={bookingHospital}
                user={user}
            />
        </div>
    );
};

export default UserDashboard;
