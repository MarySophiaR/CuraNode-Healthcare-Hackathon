import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { MapPin, Clock, BedDouble, Search } from 'lucide-react';

const COLORS = {
    primary: '#6FA3B3',
    primaryDark: '#4F8C9D',
    lightBg: '#EAF3F6',
    darkText: '#1F2D3D',
};

const DUMMY_HOSPITALS = [
    { _id: '69905b17ef120e164f788a86', name: 'City Hospital A', distance: '1.2', availableBeds: 24, eta: '8 mins', address: '12 Main Street, Downtown' },
    { _id: '507f1f77bcf86cd799439012', name: 'City Hospital B', distance: '2.5', availableBeds: 12, eta: '14 mins', address: '45 Park Avenue, Midtown' },
    { _id: '507f1f77bcf86cd799439013', name: 'City Hospital S', distance: '3.8', availableBeds: 38, eta: '19 mins', address: '88 Sunrise Blvd, Eastside' },
    { _id: '507f1f77bcf86cd799439014', name: 'City Hospital N', distance: '4.1', availableBeds: 7, eta: '22 mins', address: '5 North Ring Road, Uptown' },
    { _id: '507f1f77bcf86cd799439015', name: 'General Medical Center', distance: '5.3', availableBeds: 55, eta: '27 mins', address: '200 Central Plaza, City Center' },
    { _id: '507f1f77bcf86cd799439016', name: 'Metro Care Hospital', distance: '6.7', availableBeds: 19, eta: '31 mins', address: '71 West Lane, Riverdale' },
];

const HospitalsPage = ({ onBook }) => {
    const [hospitals, setHospitals] = useState(DUMMY_HOSPITALS);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState('distance');

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = () => {
        if (!navigator.geolocation) return;
        setLoading(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { data } = await API.post('/rank-hospitals', {
                    userLat: pos.coords.latitude,
                    userLng: pos.coords.longitude,
                    severity: 1
                });
                if (data && data.length > 0) setHospitals(data);
            } catch (err) {
                // Fall back to dummy data (already set)
            } finally {
                setLoading(false);
            }
        }, () => setLoading(false));
    };

    const sorted = [...hospitals].sort((a, b) => {
        if (sortBy === 'distance') return parseFloat(a.distance) - parseFloat(b.distance);
        if (sortBy === 'beds') return b.availableBeds - a.availableBeds;
        if (sortBy === 'wait') return parseInt(a.eta) - parseInt(b.eta);
        return 0;
    });

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: COLORS.primary, borderRadius: '0.75rem', padding: '0.6rem', color: '#fff' }}>
                        <Search size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: COLORS.darkText }}>Smart Hospital Finder</h2>
                        <p style={{ fontSize: '0.75rem', color: COLORS.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nearby Facilities</p>
                    </div>
                </div>
                <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{
                        padding: '0.6rem 1rem', borderRadius: '0.75rem', border: `1px solid ${COLORS.lightBg}`,
                        background: '#fff', fontWeight: 600, color: COLORS.darkText, outline: 'none', cursor: 'pointer', fontSize: '0.85rem'
                    }}
                >
                    <option value="distance">Sort by Distance</option>
                    <option value="beds">Sort by Available Beds</option>
                    <option value="wait">Sort by Wait Time</option>
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: COLORS.primary, fontWeight: 700 }}>
                    Locating nearby facilities...
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                    {sorted.map(hospital => (
                        <div key={hospital._id || hospital.id} style={{
                            background: '#fff',
                            borderRadius: '1.25rem',
                            border: `1px solid ${COLORS.lightBg}`,
                            padding: '1.5rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            transition: 'all 0.2s',
                        }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: COLORS.darkText, marginBottom: '0.25rem' }}>{hospital.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}>
                                <MapPin size={13} color={COLORS.primary} />
                                <span style={{ fontSize: '0.75rem', color: COLORS.primary, fontWeight: 600 }}>{hospital.distance} km away</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                <div style={{ background: COLORS.lightBg, borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: COLORS.primary }}>{hospital.availableBeds}</p>
                                    <p style={{ fontSize: '0.65rem', color: COLORS.primaryDark, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beds Available</p>
                                </div>
                                <div style={{ background: COLORS.lightBg, borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: COLORS.primary }}>{hospital.eta}</p>
                                    <p style={{ fontSize: '0.65rem', color: COLORS.primaryDark, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Travel Time</p>
                                </div>
                            </div>

                            <button
                                onClick={() => onBook(hospital)}
                                style={{
                                    width: '100%', padding: '0.75rem', background: COLORS.primary,
                                    color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 700,
                                    cursor: 'pointer', fontSize: '0.85rem', letterSpacing: '0.05em',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = COLORS.primaryDark}
                                onMouseLeave={e => e.currentTarget.style.background = COLORS.primary}
                            >
                                Book Appointment
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HospitalsPage;
