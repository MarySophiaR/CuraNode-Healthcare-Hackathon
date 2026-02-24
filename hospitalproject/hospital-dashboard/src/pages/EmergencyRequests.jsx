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

            // Listen for NEW_EMERGENCY
            socket.on('new_emergency', (data) => {
                console.log("[DISPATCH] NEW EMERGENCY RECEIVED:", data);
                // playAlertSound(); // Removed as per "remove feature" request
                // setActiveEmergency(data);
                // setShowModal(true);
                // setIncomingRequests(prev => [...prev, data]);
                setRequests((prev) => [data, ...prev]);
            });

            // Compatibility for background list updates
            socket.on('emergencyRequest', (data) => {
                console.log("[DISPATCH] Incoming request data:", data);
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
            {/* Removed Alert Banner/Sound as per "remove feature" request */}

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <AlertCircle className="text-red-500 w-5 h-5" />
                    <h1 className="text-lg font-bold text-gray-800">
                        Emergency Center
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-[#C53030] text-white' : 'text-gray-500'}`}
                    >
                        Requests ({requests.length})
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'map' ? 'bg-[#C53030] text-white' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'}`}
                    >
                        <Navigation size={14} />
                        Live Tracking ({Object.keys(activeAmbulances).length})
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                {viewMode === 'list' ? (
                    <div className="p-6 flex-1 overflow-auto">
                        {requests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32">
                                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                    <Check className="text-green-500 w-4 h-4" strokeWidth={3} />
                                </div>
                                <p className="text-sm font-bold text-gray-600 mb-1">No pending requests</p>
                                <p className="text-[11px] text-gray-400/80 font-medium">System is online and monitoring.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {requests.map((req) => {
                                    const severity = getSeverityBadge(req.severity);
                                    return (
                                        <div key={req.emergencyId} className="p-5 border border-gray-100 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className={`w-28 text-center py-2 rounded-xl text-[10px] font-black tracking-widest border shadow-sm ${severity.color}`}>
                                                    {severity.label}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                        <MapPin size={14} className="text-red-400" />
                                                        <span>{req.userLocation?.lat?.toFixed(5)}, {req.userLocation?.lng?.toFixed(5)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                                        <Clock size={14} />
                                                        <span>ETA: {req.ETA || 'Calculating...'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleReject(req.emergencyId)}
                                                    className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleAccept(req.emergencyId)}
                                                    className="px-8 py-2.5 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center gap-2"
                                                >
                                                    <Siren size={14} />
                                                    Accept & Dispatch
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 w-full relative">
                        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
                        {Object.keys(activeAmbulances).length === 0 && (
                            <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-gray-900/5 backdrop-blur-[2px]">
                                <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 text-center max-w-sm">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Ambulance size={40} className="text-gray-300" />
                                    </div>
                                    <p className="font-black text-xl text-gray-900 mb-2">No active dispatches</p>
                                    <p className="text-sm font-medium text-gray-400 px-4">Live tracking locations will appear here automatically once you accept an emergency request.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmergencyRequests;
