import { useState, useEffect, useContext, useRef } from 'react';
import SocketContext from '../context/SocketContext';
import AuthContext from '../context/AuthContext';
import NotificationContext from '../context/NotificationContext';
import { AlertCircle, Check, X, MapPin, Clock, Activity, Ambulance, Navigation, Volume2, BellRing } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const EmergencyRequests = () => {
    const { socket } = useContext(SocketContext);
    const { user } = useContext(AuthContext);
    const { clearEmergenciesCount } = useContext(NotificationContext);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeAmbulances, setActiveAmbulances] = useState({}); // { emergencyId: { lat, lng } }
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

    // Alert UI States
    const [activeEmergency, setActiveEmergency] = useState(null); // The request currently for modal
    const [showModal, setShowModal] = useState(false);
    const [incomingRequests, setIncomingRequests] = useState([]); // Buffer for banner

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({});
    const audioRef = useRef(null);

    const getLeafletIcon = (color) => new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    });

    const playAlertSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
    };

    // Initialize Map
    useEffect(() => {
        if (viewMode === 'map' && mapRef.current && !mapInstance.current) {
            mapInstance.current = L.map(mapRef.current).setView([12.9716, 77.5946], 13);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(mapInstance.current);
        }

        if (viewMode === 'list' && mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
            markersRef.current = {};
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markersRef.current = {};
            }
        };
    }, [viewMode]);

    // Update Markers on Map
    useEffect(() => {
        if (!mapInstance.current || viewMode !== 'map') return;

        Object.keys(markersRef.current).forEach(id => {
            if (!activeAmbulances[id]) {
                mapInstance.current.removeLayer(markersRef.current[id]);
                delete markersRef.current[id];
            }
        });

        Object.entries(activeAmbulances).forEach(([id, loc]) => {
            if (!markersRef.current[id]) {
                markersRef.current[id] = L.marker([loc.lat, loc.lng], { icon: getLeafletIcon('gold') })
                    .addTo(mapInstance.current)
                    .bindPopup(`Ambulance for Request #${id.slice(-4)}`);
            } else {
                markersRef.current[id].setLatLng([loc.lat, loc.lng]);
            }
        });

        const markerPoints = Object.values(activeAmbulances).map(l => [l.lat, l.lng]);
        if (markerPoints.length > 0) {
            mapInstance.current.fitBounds(markerPoints, { padding: [50, 50], maxZoom: 15 });
        }
    }, [activeAmbulances, viewMode]);

    useEffect(() => {
        clearEmergenciesCount();
        if (socket) {
            console.log("[SOCKET] Connected to emergency network.");
            setLoading(false);

            // Listen for NEW_EMERGENCY for Alert UI
            socket.on('new_emergency', (data) => {
                console.log("[DISPATCH] NEW EMERGENCY RECEIVED:", data);
                playAlertSound();
                setActiveEmergency(data);
                setShowModal(true);
                setIncomingRequests(prev => [...prev, data]);
                setRequests((prev) => [data, ...prev]);
            });

            // Compatibility for background list updates
            socket.on('emergencyRequest', (data) => {
                console.log("[DISPATCH] Incoming request data:", data);
                // If it's already in the list from new_emergency, skip
                setRequests((prev) => {
                    if (prev.find(r => r.emergencyId === data.emergencyId)) return prev;
                    return [data, ...prev];
                });
            });

            socket.on('ambulanceLocationUpdate', (data) => {
                setActiveAmbulances(prev => ({
                    ...prev,
                    [data.emergencyId]: data.coords
                }));
            });

            socket.on('ambulanceStatus', (data) => {
                if (data.status === 'arrived') {
                    setActiveAmbulances(prev => {
                        const next = { ...prev };
                        delete next[data.emergencyId];
                        return next;
                    });
                }
            });

            return () => {
                socket.off('new_emergency');
                socket.off('emergencyRequest');
                socket.off('ambulanceLocationUpdate');
                socket.off('ambulanceStatus');
            };
        }
    }, [socket]);

    const handleAccept = (emergencyId) => {
        if (!socket) return;
        socket.emit('acceptEmergency', { hospitalId: user._id, emergencyId });
        setRequests((prev) => prev.filter(req => req.emergencyId !== emergencyId));
        setIncomingRequests(prev => prev.filter(req => req.emergencyId !== emergencyId));
        if (activeEmergency?.emergencyId === emergencyId) {
            setShowModal(false);
            setActiveEmergency(null);
        }
    };

    const handleReject = (emergencyId) => {
        if (!socket) return;
        socket.emit('rejectEmergency', { emergencyId });
        setRequests((prev) => prev.filter(req => req.emergencyId !== emergencyId));
        setIncomingRequests(prev => prev.filter(req => req.emergencyId !== emergencyId));
        if (activeEmergency?.emergencyId === emergencyId) {
            setShowModal(false);
            setActiveEmergency(null);
        }
    };

    const getSeverityBadge = (level) => {
        const val = Number(level);
        if (val >= 5) return { label: 'CRITICAL', color: 'bg-red-100 text-red-700 border-red-200 animate-pulse' };
        if (val === 4) return { label: 'HIGH', color: 'bg-orange-100 text-orange-700 border-orange-200' };
        if (val === 3) return { label: 'MEDIUM', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
        return { label: 'LOW', color: 'bg-green-100 text-green-700 border-green-200' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <div className="text-gray-400 flex flex-col items-center">
                    <Activity className="w-8 h-8 animate-spin mb-2" />
                    <p>Connecting to emergency network...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative">
            {/* Alert Sound */}
            <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3" preload="auto" />

            {/* Incoming Emergency Banner */}
            {incomingRequests.length > 0 && (
                <div className="absolute top-0 left-0 right-0 z-[1001] bg-red-600 text-white py-3 px-6 rounded-xl shadow-2xl animate-bounce flex items-center justify-between mx-4 mt-4">
                    <div className="flex items-center gap-3">
                        <span className="animate-ping w-3 h-3 bg-white rounded-full" />
                        <span className="font-black tracking-widest text-sm italic">🚨 INCOMING EMERGENCY CASE - ACTION REQUIRED</span>
                    </div>
                    <div className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">
                        {incomingRequests.length} Pending Alert(s)
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <AlertCircle className="text-red-500" />
                    Emergency Center
                </h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
                    >
                        Requests ({requests.length})
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'map' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
                    >
                        <Navigation size={16} />
                        Live Tracking ({Object.keys(activeAmbulances).length})
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                {viewMode === 'list' ? (
                    <div className="p-6">
                        {requests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-200 rounded-xl">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                    <Check className="text-green-500 w-6 h-6" />
                                </div>
                                <p className="text-gray-500 font-medium">No pending requests</p>
                                <p className="text-gray-400 text-sm">System is online and monitoring.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {requests.map((req) => {
                                    const severity = getSeverityBadge(req.severity);
                                    return (
                                        <div key={req.emergencyId} className="p-4 border border-gray-100 rounded-xl flex items-center justify-between hover:bg-gray-50 transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className={`w-24 text-center py-1.5 rounded-lg text-xs font-bold border ${severity.color}`}>
                                                    {severity.label}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin size={16} className="text-gray-400" />
                                                        <span>{req.userLocation?.lat?.toFixed(4)}, {req.userLocation?.lng?.toFixed(4)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={16} className="text-gray-400" />
                                                        <span>{req.ETA || 'Calculating...'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleReject(req.emergencyId)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-white rounded-lg transition-all">Reject</button>
                                                <button onClick={() => handleAccept(req.emergencyId)} className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-all shadow-sm">Accept & Dispatch</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full w-full relative">
                        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
                        {Object.keys(activeAmbulances).length === 0 && (
                            <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-gray-900/5 backdrop-blur-[2px]">
                                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 text-center">
                                    <Ambulance size={40} className="mx-auto mb-3 text-gray-300" />
                                    <p className="font-bold text-gray-800">No active dispatches</p>
                                    <p className="text-sm text-gray-500">Live locations will appear here after accepting requests.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* EMERGENCY ALERT MODAL */}
            {showModal && activeEmergency && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border-4 border-red-600 animate-in fade-in zoom-in duration-300">
                        <div className="bg-red-600 text-white p-6 text-center relative">
                            <BellRing className="w-12 h-12 mx-auto mb-2 animate-bounce" />
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase">Incoming Emergency</h2>
                            <p className="text-red-100 text-sm font-bold opacity-80 uppercase">Immediate Dispatch Required</p>
                            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient ID</p>
                                    <p className="font-bold text-gray-900">USR-{activeEmergency.userId.slice(-6).toUpperCase()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Severity</p>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-black w-fit border ${getSeverityBadge(activeEmergency.severity).color}`}>
                                        {getSeverityBadge(activeEmergency.severity).label}
                                    </div>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location Coordinates</p>
                                    <p className="font-bold text-gray-900 flex items-center gap-1">
                                        <MapPin size={14} className="text-red-600" />
                                        {activeEmergency.userLocation.lat.toFixed(6)}, {activeEmergency.userLocation.lng.toFixed(6)}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4 italic">
                                <Clock className="text-gray-400" size={20} />
                                <p className="text-sm text-gray-500 leading-relaxed font-medium">Estimated arrival time from current position is approximately <span className="text-red-600 font-bold underline">8 minutes</span>.</p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => handleReject(activeEmergency.emergencyId)}
                                    className="flex-1 py-4 text-gray-500 font-black uppercase text-xs tracking-widest hover:bg-gray-50 rounded-2xl transition-all"
                                >
                                    Reject Request
                                </button>
                                <button
                                    onClick={() => handleAccept(activeEmergency.emergencyId)}
                                    className="flex-[2] py-4 bg-red-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-2"
                                >
                                    <Ambulance size={18} />
                                    Dispatch Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmergencyRequests;
