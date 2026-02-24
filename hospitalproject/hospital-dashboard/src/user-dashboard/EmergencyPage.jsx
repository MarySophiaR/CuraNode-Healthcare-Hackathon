import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import API from '../services/api';
import SocketContext from '../context/SocketContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Siren, Clock, Locate, MapPin, Activity, Navigation,
    Phone, ShieldCheck, CheckCircle2, Loader2, AlertTriangle, X
} from 'lucide-react';

const C = {
    primary: '#b91c1c', // Emergency Red
    primaryDark: '#991b1b',
    teal: '#6FA3B3',
    lightBg: '#fcfcfc',
    softGray: '#f3f4f6',
    border: '#e5e7eb',
    darkText: '#1f2937',
    white: '#ffffff',
};

// --- Custom Components ---

const CustomToast = ({ show }) => {
    if (!show) return null;
    return (
        <div style={{
            position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 2000, display: 'flex', alignItems: 'center', gap: 12,
            background: C.teal, color: C.white, padding: '16px 24px',
            borderRadius: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: '50%' }}>
                <CheckCircle2 size={24} color="#fff" />
            </div>
            <div>
                <p style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Ambulance Arrived</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>Medical assistance is at your location.</p>
            </div>
        </div>
    );
};

const ArrivalCard = ({ driver, eta, status }) => {
    if (!driver) return null;
    const isArrived = status === 'arrived';

    return (
        <div style={{
            position: 'absolute', top: 16, right: 16, width: 340,
            background: C.white, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden', zIndex: 1500, border: `2px solid ${C.teal}`
        }}>
            <div style={{ background: C.teal, padding: 16, color: C.white }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    {isArrived ? <CheckCircle2 size={20} /> : <Siren size={20} className="animate-pulse" />}
                    {isArrived ? 'Medical Team On Site' : 'Ambulance En Route'}
                </h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9, margin: 0 }}>
                        {isArrived ? 'Assistance has arrived at your location.' : `Estimated Arrival: ${eta?.replace('mins', 'Minutes') || 'Calculating...'}`}
                    </p>
                </div>
            </div>

            {!isArrived && (
                <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                        <div style={{ width: 64, height: 64, background: C.softGray, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.teal}`, overflow: 'hidden' }}>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.name}`} alt="Driver" style={{ width: '100%', height: '100%' }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: C.darkText, margin: 0 }}>{driver.name}</h3>
                            <p style={{ fontSize: '0.85rem', color: C.darkText, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                                Paramedic • <span style={{ fontFamily: 'monospace', background: C.softGray, padding: '1px 6px', borderRadius: 4 }}>{driver.vehicleNo}</span>
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button style={{
                            flex: 1, background: C.white, border: `1.5px solid ${C.teal}`,
                            borderRadius: 10, padding: '10px', color: C.darkText, fontWeight: 700,
                            fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'
                        }}>
                            <Phone size={16} /> Contact Driver
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const HoldToConfirmButton = ({ onConfirm, isDisabled }) => {
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef(null);
    const [isHolding, setIsHolding] = useState(false);

    const startHold = () => {
        if (isDisabled) return;
        setIsHolding(true);
        intervalRef.current = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(intervalRef.current);
                    onConfirm();
                    return 100;
                }
                return prev + 2;
            });
        }, 60);
    };

    const stopHold = () => {
        setIsHolding(false);
        clearInterval(intervalRef.current);
        setProgress(0);
    };

    return (
        <button
            onMouseDown={startHold} onMouseUp={stopHold} onMouseLeave={stopHold}
            onTouchStart={startHold} onTouchEnd={stopHold}
            disabled={isDisabled}
            style={{
                position: 'relative', width: '100%', padding: '16px', borderRadius: 12,
                background: isDisabled ? C.softGray : C.primary, color: isDisabled ? '#999' : C.white,
                fontWeight: 800, fontSize: '0.9rem', border: 'none', cursor: isDisabled ? 'not-allowed' : 'pointer',
                overflow: 'hidden', transition: 'all 0.2s', userSelect: 'none', letterSpacing: '0.05em'
            }}
        >
            <div
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${progress}%`, background: C.primaryDark, transition: 'width 0.07s linear', opacity: 0.4 }}
            />
            <span style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {isHolding && progress < 100 ? `HOLDING... ${Math.round((progress / 100) * 3)}s` : 'HOLD 3 SECONDS TO CONFIRM'}
            </span>
        </button>
    );
};

const EmergencyModal = ({ show, onClose, onConfirm, location }) => {
    const [checked, setChecked] = useState(false);
    if (!show) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: C.white, borderRadius: 20, maxWidth: 440, width: '100%', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', borderTop: `8px solid ${C.primary}` }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ width: 64, height: 64, background: C.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <AlertTriangle size={32} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.darkText, marginBottom: 8 }}>Emergency Confirmation</h2>
                    <p style={{ fontSize: '0.9rem', color: C.darkText, lineHeight: 1.6, margin: 0 }}>
                        This service is for <strong style={{ color: C.primary }}>REAL medical emergencies only</strong>. Misuse may delay help for someone in critical condition.
                    </p>
                </div>

                <div style={{ background: C.softGray, padding: 16, borderRadius: 12, marginBottom: 24, border: `1.5px solid ${C.primary}33` }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: C.darkText, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Your Detected Location</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.darkText, fontWeight: 700, fontSize: '0.9rem' }}>
                        <MapPin size={16} color={C.primary} />
                        {location || "Detecting address..."}
                    </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, background: '#fee2e2', borderRadius: 12, marginBottom: 24, cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setChecked(e.target.checked)}
                        style={{ marginTop: 2, accentColor: C.primary, width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: C.darkText, lineHeight: 1.5 }}>
                        I confirm this is a real medical emergency and I require immediate assistance.
                    </span>
                </label>

                <HoldToConfirmButton onConfirm={onConfirm} isDisabled={!checked} />

                <button
                    onClick={onClose}
                    style={{ width: '100%', marginTop: 16, padding: 12, background: 'transparent', border: 'none', color: C.darkText, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                    Cancel Request
                </button>
            </div>
        </div>
    );
};

// --- Main Page ---

const EmergencyPage = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [severity, setSeverity] = useState(5);
    const [emergencyStatus, setEmergencyStatus] = useState('idle');
    const [ambulanceLoc, setAmbulanceLoc] = useState(null);
    const [driverDetails, setDriverDetails] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [pendingHospital, setPendingHospital] = useState(null);
    const { socket } = useContext(SocketContext);

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({});
    const polylineRef = useRef(null);
    const demoSimInterval = useRef(null);

    const getLeafletIcon = (color) => new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    });

    // Initialize Map
    useEffect(() => {
        if (!mapInstance.current && mapRef.current) {
            mapInstance.current = L.map(mapRef.current, { zoomControl: false }).setView([12.9716, 77.5946], 13);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(mapInstance.current);
        }

        const timeout = setTimeout(() => {
            if (!userLocation) setUserLocation({ lat: 12.9716, lng: 77.5946 });
        }, 2000);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    clearTimeout(timeout);
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                () => {
                    clearTimeout(timeout);
                    setUserLocation({ lat: 12.9716, lng: 77.5946 });
                }
            );
        }

        if (socket) {
            socket.on('ambulanceDispatched', (data) => {
                setDriverDetails(data.driver || { name: 'Emergency Driver', vehicleNo: 'EMS-99' });
                setEmergencyStatus('enroute');
                if (demoSimInterval.current) clearInterval(demoSimInterval.current);
            });
            socket.on('ambulanceLocationUpdate', (loc) => {
                if (loc.coords) setAmbulanceLoc(loc.coords);
            });
            socket.on('ambulanceStatus', (data) => {
                if (data.status === 'arrived') {
                    setEmergencyStatus('arrived');
                    setShowToast(true);
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.play().catch(() => { });
                    setTimeout(() => setShowToast(false), 5000);
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('ambulanceLocationUpdate');
                socket.off('ambulanceStatus');
            }
            if (demoSimInterval.current) clearInterval(demoSimInterval.current);
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [socket]);

    // Update Map Elements
    useEffect(() => {
        if (!mapInstance.current || !userLocation) return;

        // User Marker
        if (!markersRef.current.user) {
            markersRef.current.user = L.marker([userLocation.lat, userLocation.lng], { icon: getLeafletIcon('blue') })
                .addTo(mapInstance.current).bindPopup("You are here");
            mapInstance.current.setView([userLocation.lat, userLocation.lng], 13);
        } else {
            markersRef.current.user.setLatLng([userLocation.lat, userLocation.lng]);
        }

        // Hospital Markers
        Object.keys(markersRef.current).forEach(k => {
            if (k !== 'user' && k !== 'ambulance') {
                mapInstance.current.removeLayer(markersRef.current[k]);
                delete markersRef.current[k];
            }
        });

        hospitals.forEach((h, i) => {
            const marker = L.marker([h.lat, h.lng], { icon: getLeafletIcon('red') })
                .addTo(mapInstance.current)
                .bindPopup(`<strong>${h.name}</strong><br/>${h.eta}`);
            marker.on('click', () => setSelectedHospital(h));
            markersRef.current[`h_${i}`] = marker;
        });

        // Polyline
        if (polylineRef.current) mapInstance.current.removeLayer(polylineRef.current);
        if (selectedHospital && userLocation) {
            polylineRef.current = L.polyline([[userLocation.lat, userLocation.lng], [selectedHospital.lat, selectedHospital.lng]], {
                color: C.primary, weight: 4, dashArray: '10, 10', opacity: 0.7
            }).addTo(mapInstance.current);

            const boundsArr = [[userLocation.lat, userLocation.lng], [selectedHospital.lat, selectedHospital.lng]];
            mapInstance.current.fitBounds(boundsArr, { padding: [50, 50] });
        }

    }, [userLocation, hospitals, selectedHospital]);

    // Update Ambulance Location on Map
    useEffect(() => {
        if (!mapInstance.current || !ambulanceLoc) return;
        if (!markersRef.current.ambulance) {
            markersRef.current.ambulance = L.marker([ambulanceLoc.lat, ambulanceLoc.lng], { icon: getLeafletIcon('gold') })
                .addTo(mapInstance.current).bindPopup("Ambulance");
        } else {
            markersRef.current.ambulance.setLatLng([ambulanceLoc.lat, ambulanceLoc.lng]);
        }
    }, [ambulanceLoc]);

    const handleFindHelp = async () => {
        setHospitals([]); setSelectedHospital(null); setAmbulanceLoc(null);
        setLoading(true); setSearchPerformed(true); setEmergencyStatus('searching');

        try {
            const lat = userLocation?.lat || 12.9716;
            const lng = userLocation?.lng || 77.5946;
            const { data } = await API.post('/rank-hospitals', { userLat: lat, userLng: lng, severity });

            const finalHospitals = data && data.length > 0 ? data : [
                { id: '69905b17ef120e164f788a86', name: 'City Hospital A', distance: '0.8', eta: '5 mins', availableBeds: 12, lat: lat + 0.005, lng: lng + 0.005 },
                { id: '69905f3bef120e164f788aaa', name: 'City Hospital S', distance: '1.2', eta: '8 mins', availableBeds: 8, lat: lat - 0.004, lng: lng + 0.006 },
                { id: '69907d3fed852f07dc61a60a', name: 'City Hospital N', distance: '1.8', eta: '12 mins', availableBeds: 5, lat: lat + 0.007, lng: lng - 0.003 },
                { id: '69984ac9f8758bdab86e242f', name: 'City Hospital O', distance: '2.5', eta: '15 mins', availableBeds: 10, lat: lat - 0.006, lng: lng - 0.005 }
            ];

            setHospitals(finalHospitals);
            if (finalHospitals.length > 0) setSelectedHospital(finalHospitals[0]);
        } catch (error) {
            const lat = userLocation?.lat || 12.9716;
            const lng = userLocation?.lng || 77.5946;
            const dummy = [
                { id: '69905b17ef120e164f788a86', name: 'City Hospital A', distance: '0.8', eta: '5 mins', availableBeds: 12, lat: lat + 0.005, lng: lng + 0.005 },
                { id: '69905f3bef120e164f788aaa', name: 'City Hospital S', distance: '1.2', eta: '8 mins', availableBeds: 8, lat: lat - 0.004, lng: lng + 0.006 },
                { id: '69907d3fed852f07dc61a60a', name: 'City Hospital N', distance: '1.8', eta: '12 mins', availableBeds: 5, lat: lat + 0.007, lng: lng - 0.003 },
                { id: '69984ac9f8758bdab86e242f', name: 'City Hospital O', distance: '2.5', eta: '15 mins', availableBeds: 10, lat: lat - 0.006, lng: lng - 0.005 }
            ];
            setHospitals(dummy);
            setSelectedHospital(dummy[0]);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDispatch = () => {
        if (!pendingHospital) return;
        setShowConfirmModal(false);
        setEmergencyStatus('dispatched');

        socket?.emit('emergencyRequest', {
            selectedHospitalId: pendingHospital.id,
            userLocation: {
                lat: userLocation?.lat || 12.9716,
                lng: userLocation?.lng || 77.5946
            },
            severity: severity
        });

        setTimeout(() => {
            if (!driverDetails) {
                setDriverDetails({ name: 'Demo Paramedic', vehicleNo: 'DEMO-911' });
                setEmergencyStatus('enroute');
                let progress = 0;
                const startLat = pendingHospital.lat; const startLng = pendingHospital.lng;
                const endLat = userLocation?.lat || 12.9716; const endLng = userLocation?.lng || 77.5946;

                demoSimInterval.current = setInterval(() => {
                    progress += 4;
                    if (progress > 100) {
                        clearInterval(demoSimInterval.current);
                        setEmergencyStatus('arrived');
                        setAmbulanceLoc({ lat: endLat, lng: endLng });
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 5000);
                        return;
                    }
                    const currentLat = startLat + (endLat - startLat) * (progress / 100);
                    const currentLng = startLng + (endLng - startLng) * (progress / 100);
                    setAmbulanceLoc({ lat: currentLat, lng: currentLng });
                }, 1500);
            }
        }, 3000);
    };

    const handleCancel = () => {
        setEmergencyStatus('idle'); setAmbulanceLoc(null); setDriverDetails(null); setShowToast(false);
        if (demoSimInterval.current) clearInterval(demoSimInterval.current);
        if (markersRef.current.ambulance) {
            mapInstance.current.removeLayer(markersRef.current.ambulance);
            delete markersRef.current.ambulance;
        }
        socket?.emit('cancel_ambulance');
    };

    return (
        <div style={{ display: 'flex', height: '100%', width: '100%', background: C.white, overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>

            {/* Sidebar */}
            <div style={{ width: 400, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}`, background: C.white, zIndex: 10 }}>
                <div style={{ padding: '32px 24px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, background: '#fee2e2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Siren size={24} color={C.primary} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: C.darkText, margin: 0 }}>Emergency Response</h2>
                        </div>
                        <span style={{
                            fontSize: '0.7rem', fontWeight: 900, padding: '4px 12px', borderRadius: 20,
                            background: (['enroute', 'dispatched', 'arrived'].includes(emergencyStatus)) ? C.primary : '#f3f4f6',
                            color: (['enroute', 'dispatched', 'arrived'].includes(emergencyStatus)) ? C.white : '#666',
                            textTransform: 'uppercase'
                        }}>
                            {emergencyStatus === 'enroute' ? 'RESPONDING' : emergencyStatus.toUpperCase()}
                        </span>
                    </div>

                    {['idle', 'searching'].includes(emergencyStatus) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, display: 'block' }}>INCIDENT SEVERITY LEVEL</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                                    {[
                                        { val: 2, label: 'Low' }, { val: 5, label: 'Med' }, { val: 8, label: 'High' }, { val: 10, label: 'Crit' }
                                    ].map((level) => {
                                        const active = severity === level.val;
                                        const isMed = level.label === 'Med';
                                        return (
                                            <button key={level.val} onClick={() => setSeverity(level.val)} style={{
                                                padding: '12px 0', borderRadius: 12, border: active ? `2px solid ${isMed ? '#d97706' : C.primary}` : '1.5px solid #e5e7eb',
                                                background: active ? (isMed ? '#fef3c7' : '#fee2e2') : '#fff', color: active ? (isMed ? '#92400e' : C.primary) : '#374151',
                                                fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer'
                                            }}>{level.label}</button>
                                        );
                                    })}
                                </div>
                            </div>
                            <button onClick={handleFindHelp} disabled={loading} style={{
                                width: '100%', height: 56, background: C.primary, color: C.white, borderRadius: 14, border: 'none', fontWeight: 800, fontSize: '1rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(185,28,28,0.3)'
                            }}>
                                {loading ? <Loader2 size={24} className="animate-spin" /> : <Locate size={20} />}
                                {loading ? 'Locating Specialists...' : 'Find Nearest Help'}
                            </button>
                        </div>
                    ) : (
                        <div style={{ background: '#fee2e2', border: `1.5px solid ${C.primary}`, borderRadius: 14, padding: 20 }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: C.primary, display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 10px 0' }}>
                                {emergencyStatus === 'arrived' ? <CheckCircle2 size={22} /> : <Activity size={22} />}
                                {emergencyStatus === 'arrived' ? 'Medical Team On Site' : 'Ambulance En Route'}
                            </h3>
                            <button onClick={handleCancel} style={{ fontSize: '0.85rem', fontWeight: 800, color: C.primary, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>Cancel Request</button>
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                    {!searchPerformed && !loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', opacity: 0.3 }}>
                            <Activity size={64} color={C.darkText} style={{ marginBottom: 16 }} />
                            <p style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Ready to find help.</p>
                        </div>
                    )}
                    {hospitals.map((hospital, idx) => {
                        const active = selectedHospital?.id === hospital.id;
                        return (
                            <div key={hospital.id || idx} onClick={() => !['dispatched', 'enroute', 'arrived'].includes(emergencyStatus) && setSelectedHospital(hospital)} style={{
                                position: 'relative', background: C.white, borderRadius: 16, padding: 20, border: active ? `2px solid ${C.teal}` : '1.5px solid #f0f0f0', marginBottom: 16, cursor: 'pointer',
                                boxShadow: active ? '0 8px 16px rgba(111,163,179,0.1)' : 'none'
                            }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: C.darkText, margin: 0 }}>{hospital.name}</h3>
                                {idx === 0 && !['dispatched', 'enroute', 'arrived'].includes(emergencyStatus) && (
                                    <button onClick={(e) => { e.stopPropagation(); setPendingHospital(hospital); setShowConfirmModal(true); }} style={{
                                        marginTop: 20, width: '100%', background: C.primary, color: C.white, border: 'none', borderRadius: 10, fontWeight: 800, fontSize: '0.85rem', padding: '12px 0', cursor: 'pointer'
                                    }}>Dispatch Immediately</button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Map Area */}
            <div style={{ flex: 1, position: 'relative', background: C.softGray }}>
                <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
                {!userLocation && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.softGray, zIndex: 1000 }}>
                        <div style={{ textAlign: 'center', background: C.white, padding: '40px', borderRadius: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                            <Loader2 size={40} color={C.primary} className="animate-spin" style={{ margin: '0 auto 16px' }} />
                            <p style={{ fontWeight: 800, fontSize: '1rem', color: C.darkText }}>Getting your location...</p>
                        </div>
                    </div>
                )}
                <CustomToast show={showToast} />
                {(['dispatched', 'enroute'].includes(emergencyStatus)) && driverDetails && (
                    <ArrivalCard driver={driverDetails} eta={selectedHospital?.eta} status={emergencyStatus} />
                )}
                <EmergencyModal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirmDispatch} location={userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : "Detecting..."} />
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default EmergencyPage;
