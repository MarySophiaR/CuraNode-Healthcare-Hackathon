import React, { useState } from 'react';
import API from '../services/api';
import { CalendarCheck, Loader2, CheckCircle2, AlertCircle, Clock, ShieldCheck, ChevronDown } from 'lucide-react';

const C = {
    primary: '#6FA3B3',
    primaryDark: '#4F8C9D',
    lightBg: '#EAF3F6',
    softGray: '#F5F7F8',
    darkText: '#1F2D3D',
    white: '#ffffff',
};

const QueueBooking = () => {
    const [hospitalId, setHospitalId] = useState('');
    const [priority, setPriority] = useState('normal');
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(null);
    const [error, setError] = useState('');

    const handleBooking = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Simulate queue logic
            await new Promise(resolve => setTimeout(resolve, 1500));

            const queueNumber = Math.floor(Math.random() * 50) + 1;
            const waitTime = Math.floor(Math.random() * 60) + 5;

            setBooking({
                token: `Q-${queueNumber}`,
                hospital: hospitalId || 'City Gen Hospital',
                wait: `${waitTime} mins`,
                priority: priority.toUpperCase()
            });

        } catch (err) {
            setError('Booking failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: 860, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.darkText, display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
                <CalendarCheck size={24} color={C.primary} /> Queue Booking System
            </h2>

            {!booking ? (
                <div style={{
                    background: C.white, padding: '2.5rem', borderRadius: 28,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0',
                    maxWidth: 500, margin: '0 auto', position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: C.lightBg, borderRadius: '50%', opacity: 0.5 }} />

                    <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: 4 }}>Select Medical Facility</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    required
                                    value={hospitalId}
                                    onChange={(e) => setHospitalId(e.target.value)}
                                    style={{
                                        width: '100%', border: 'none', borderRadius: 16, padding: '16px',
                                        background: C.softGray, fontWeight: 800, fontSize: '0.85rem',
                                        color: C.darkText, outline: 'none', cursor: 'pointer', appearance: 'none'
                                    }}
                                >
                                    <option value="">-- Choose Facility --</option>
                                    <option value="City General Hospital">City General Hospital</option>
                                    <option value="Community Health Center">Community Health Center</option>
                                    <option value="Apollo Clinic">Apollo Clinic</option>
                                </select>
                                <ChevronDown size={18} color={C.primary} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: 4 }}>Priority Category</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                {['normal', 'elderly', 'pregnancy'].map(type => {
                                    const active = priority === type;
                                    return (
                                        <button
                                            type="button"
                                            key={type}
                                            onClick={() => setPriority(type)}
                                            style={{
                                                padding: '12px 0', borderRadius: 12, border: active ? `2px solid ${C.primary}` : '1.5px solid #e5e7eb',
                                                background: active ? C.primary : C.white,
                                                color: active ? C.white : '#6b7280',
                                                fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
                                                letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s',
                                                boxShadow: active ? '0 4px 12px rgba(111,163,179,0.25)' : 'none'
                                            }}
                                            onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = C.primary; }}
                                            onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                        >
                                            {type}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {error && (
                            <div style={{ padding: '12px', background: '#fef2f2', color: '#ef4444', fontSize: '0.75rem', fontWeight: 800, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !hospitalId}
                            style={{
                                width: '100%', background: (loading || !hospitalId) ? '#e5e7eb' : C.primary,
                                color: (loading || !hospitalId) ? '#a1a1aa' : C.white,
                                border: 'none', padding: '16px', borderRadius: 16, fontWeight: 800,
                                fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em',
                                cursor: (loading || !hospitalId) ? 'not-allowed' : 'pointer',
                                boxShadow: (loading || !hospitalId) ? 'none' : '0 6px 20px rgba(111,163,179,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { if (!loading && hospitalId) e.currentTarget.style.background = C.primaryDark; }}
                            onMouseLeave={e => { if (!loading && hospitalId) e.currentTarget.style.background = C.primary; }}
                        >
                            {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <>Generate Token <ShieldCheck size={18} /></>}
                        </button>
                    </form>
                </div>
            ) : (
                <div style={{
                    background: C.white, padding: '3rem', borderRadius: 40,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0',
                    maxWidth: 450, margin: '0 auto', textCenter: 'center', textAlign: 'center',
                    position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, background: C.primary }} />

                    <div style={{ width: 80, height: 80, background: C.lightBg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <CheckCircle2 size={40} color={C.primary} />
                    </div>

                    <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: C.darkText, marginBottom: 8, letterSpacing: '-0.02em' }}>Confirmed!</h3>
                    <p style={{ fontSize: '0.8rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 32 }}>Your token is ready</p>

                    <div style={{ background: C.lightBg, borderRadius: 24, padding: '24px', border: `1px solid ${C.primary}33`, marginBottom: 32, position: 'relative' }}>
                        <div style={{
                            position: 'absolute', top: -12, right: 16, background: C.primary,
                            color: C.white, fontSize: '0.6rem', fontWeight: 900, padding: '4px 12px',
                            borderRadius: 20, boxShadow: '0 4px 10px rgba(111,163,179,0.3)',
                            textTransform: 'uppercase', letterSpacing: '0.1em'
                        }}>
                            {booking.priority}
                        </div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: 12 }}>Current Token</div>
                        <div style={{ fontSize: '4rem', fontWeight: 900, color: C.darkText, letterSpacing: '-0.05em', marginBottom: 24, fontFamily: 'monospace' }}>{booking.token}</div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #d1d5db', paddingTop: 20 }}>
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Queue ID</p>
                                <p style={{ fontSize: '0.8rem', fontWeight: 800, color: C.darkText }}>#CN-HEALTH-SERVICE</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Est. Wait</p>
                                <p style={{ fontSize: '0.8rem', fontWeight: 800, color: C.primary, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={14} /> {booking.wait}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setBooking(null)}
                        style={{ background: 'none', border: 'none', fontSize: '0.7rem', fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = C.primary}
                        onMouseLeave={e => e.currentTarget.style.color = '#aaa'}
                    >
                        Book Another Service
                    </button>
                </div>
            )}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default QueueBooking;
