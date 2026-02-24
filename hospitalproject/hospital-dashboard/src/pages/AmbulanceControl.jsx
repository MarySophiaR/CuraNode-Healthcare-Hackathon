import { useState, useEffect, useContext, useRef } from 'react';
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import SocketContext from '../context/SocketContext';
import { Ambulance, Clock, MapPin, CheckCircle, AlertCircle, Navigation, Users, Activity, Play, Beaker } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const AmbulanceControl = () => {
    const { user } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [fleet, setFleet] = useState({
        total: 5,
        available: 5,
        dispatches: []
    });
    const [loading, setLoading] = useState(true);
    const [trackingData, setTrackingData] = useState({}); // { emergencyId: { lat, lng, progress, status, isDemo } }
    const [mapView, setMapView] = useState(true);
    const [demoMode, setDemoMode] = useState(false);

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({});
    const demoSimInterval = useRef(null);

    const getLeafletIcon = (color) => new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    });

    const fetchFleetData = async () => {
        try {
            const { data } = await API.get('/auth/me');
            setFleet({
                total: data.ambulancesTotal || 5,
                available: data.ambulancesAvailable || 5,
                dispatches: data.activeDispatches || []
            });
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch fleet data', error);
            setLoading(false);
        }
    };

    // Initialize Demo Data
    const toggleDemo = () => {
        if (!demoMode) {
            const demoMissions = {
                'demo-1': { lat: 12.9750, lng: 77.5920, progress: 45, status: 'Moving', isDemo: true, patient: 'John Doe', severity: 'Critical' },
                'demo-2': { lat: 12.9650, lng: 77.6100, progress: 95, status: 'Arrived at Patient', isDemo: true, patient: 'Jane Smith', severity: 'High' },
                'demo-3': { lat: 12.9850, lng: 77.6000, progress: 20, status: 'Moving', isDemo: true, patient: 'Michael Roe', severity: 'Medium' }
            };
            setTrackingData(prev => ({ ...prev, ...demoMissions }));
            setDemoMode(true);
        } else {
            setTrackingData(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(id => { if (next[id].isDemo) delete next[id]; });
                return next;
            });
            setDemoMode(false);
        }
    };

    // Demo Simulation Animation
    useEffect(() => {
        if (demoMode) {
            demoSimInterval.current = setInterval(() => {
                setTrackingData(prev => {
                    const next = { ...prev };
                    Object.keys(next).forEach(id => {
                        if (next[id].isDemo && next[id].status === 'Moving') {
                            next[id] = {
                                ...next[id],
                                lat: next[id].lat + (Math.random() - 0.5) * 0.0005,
                                lng: next[id].lng + (Math.random() - 0.5) * 0.0005,
                                progress: Math.min(100, next[id].progress + 0.5)
                            };
                            if (next[id].progress >= 100) next[id].status = 'Arrived at Patient';
                        }
                    });
                    return next;
                });
            }, 2000);
        } else {
            if (demoSimInterval.current) clearInterval(demoSimInterval.current);
        }
        return () => { if (demoSimInterval.current) clearInterval(demoSimInterval.current); };
    }, [demoMode]);

    // Map Initialization
    useEffect(() => {
        if (mapView && mapRef.current && !mapInstance.current) {
            try {
                mapInstance.current = L.map(mapRef.current).setView([12.9716, 77.5946], 13);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(mapInstance.current);
            } catch (err) {
                console.error("Leaflet init error:", err);
            }
        }
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markersRef.current = {};
            }
        };
    }, [mapView]);

    // Update markers on map
    useEffect(() => {
        if (!mapInstance.current) return;

        // Clear markers for finished dispatches
        Object.keys(markersRef.current).forEach(id => {
            if (!trackingData[id]) {
                mapInstance.current.removeLayer(markersRef.current[id]);
                delete markersRef.current[id];
            }
        });

        // Add or update markers
        Object.entries(trackingData).forEach(([id, data]) => {
            if (data.lat && data.lng) {
                const iconColor = data.isDemo ? 'blue' : 'gold';
                if (!markersRef.current[id]) {
                    markersRef.current[id] = L.marker([data.lat, data.lng], { icon: getLeafletIcon(iconColor) })
                        .addTo(mapInstance.current)
                        .bindPopup(`<b>${data.isDemo ? 'DEMO Mission' : 'Active Mission'}</b><br/>ID: ${id.slice(-4)}<br/>Status: ${data.status}`);
                } else {
                    markersRef.current[id].setLatLng([data.lat, data.lng]);
                    markersRef.current[id].getPopup().setContent(`<b>${data.isDemo ? 'DEMO Mission' : 'Active Mission'}</b><br/>ID: ${id.slice(-4)}<br/>Status: ${data.status}`);
                }
            }
        });

        // Fit bounds if dispatches exist
        const points = Object.values(trackingData).filter(d => d.lat).map(d => [d.lat, d.lng]);
        if (points.length > 0) {
            mapInstance.current.fitBounds(points, { padding: [50, 50], maxZoom: 15 });
        }
    }, [trackingData]);

    useEffect(() => {
        fetchFleetData();

        if (socket) {
            socket.on('ambulanceLocationUpdate', (data) => {
                setTrackingData(prev => ({
                    ...prev,
                    [data.emergencyId]: {
                        ...prev[data.emergencyId],
                        lat: data.coords.lat,
                        lng: data.coords.lng,
                        progress: data.progress,
                        status: 'Moving',
                        isDemo: false
                    }
                }));
            });

            socket.on('ambulanceStatus', (data) => {
                if (data.status === 'arrived') {
                    setTrackingData(prev => ({
                        ...prev,
                        [data.emergencyId]: {
                            ...prev[data.emergencyId],
                            status: 'Arrived at Patient'
                        }
                    }));
                }
            });

            socket.on('hospitalUpdate', (data) => {
                if (data.hospitalId === user?._id || data.hospitalId === user?.id) {
                    setFleet(prev => ({
                        ...prev,
                        available: data.ambulancesAvailable,
                        dispatches: data.activeDispatches || prev.dispatches
                    }));
                }
            });

            return () => {
                socket.off('ambulanceLocationUpdate');
                socket.off('ambulanceStatus');
                socket.off('hospitalUpdate');
            };
        }
    }, [socket, user]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading fleet stats...</div>;

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Ambulance className="text-[#6FA3B3]" />
                        Fleet Control Center
                    </h1>
                    <button onClick={toggleDemo} className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${demoMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {demoMode ? <Beaker size={12} /> : <Play size={12} />}
                        {demoMode ? 'Live Demo On' : 'Start Demo'}
                    </button>
                </div>
                <div className="flex bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
                    <button onClick={() => setMapView(true)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mapView ? 'bg-[#6FA3B3] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Map View</button>
                    <button onClick={() => setMapView(false)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!mapView ? 'bg-[#6FA3B3] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Grid View</button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Fleet</p>
                    <p className="text-3xl font-black text-gray-900">{fleet.total || 5}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Available</p>
                    <p className="text-3xl font-black text-green-600">{(fleet.available || 5) - (Object.keys(trackingData).filter(id => !trackingData[id].isDemo).length)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Missions</p>
                    <p className="text-3xl font-black text-blue-600">{Object.keys(trackingData).length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <p className={`text-3xl font-black ${Object.keys(trackingData).length > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                        {Object.keys(trackingData).length > 0 ? 'Busy' : 'Idle'}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-[500px] flex gap-6">
                {/* Left: Interactive Section */}
                <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
                    {mapView ? (
                        <div className="h-full w-full">
                            <div ref={mapRef} className="h-full w-full" />
                            {Object.keys(trackingData).length === 0 && (
                                <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-gray-900/5 backdrop-blur-[2px]">
                                    <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 text-center max-w-sm">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Navigation size={40} className="text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">Fleet Standing By</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">No active dispatches currently on the road. Ready to respond to new emergencies.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[600px] custom-scrollbar">
                            {Object.entries(trackingData).map(([id, data]) => (
                                <div key={id} className={`p-6 rounded-2xl border transition-all ${data.isDemo ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100 bg-gray-50'} group hover:bg-white hover:shadow-md`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${data.isDemo ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                                <Ambulance size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-gray-900">EMS-{id.slice(-4)}</h4>
                                                    {data.isDemo && <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black">DEMO</span>}
                                                </div>
                                                <p className="text-xs text-blue-600 font-bold uppercase">{data.status}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Patient</p>
                                            <p className="font-bold text-gray-900 text-sm">{data.patient || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-500 ${data.isDemo ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${data.progress || 0}%` }} />
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
                                            <span>Origin</span>
                                            <span>{Math.round(data.progress || 0)}%</span>
                                            <span>Patient Location</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(trackingData).length === 0 && (
                                <div className="col-span-full py-20 text-center text-gray-400">
                                    <AlertCircle size={40} className="mx-auto mb-2 opacity-20" />
                                    <p className="font-bold">No active missions in list view</p>
                                    <button onClick={toggleDemo} className="mt-4 text-[#6FA3B3] text-sm font-bold hover:underline">Start Demo Simulation</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Live Activity Sidebar */}
                <div className="w-80 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-full flex flex-col">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-[#6FA3B3]" />
                            Fleet Activity Log
                        </h3>
                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {Object.entries(trackingData).reverse().map(([id, data]) => (
                                <div key={id} className={`relative pl-6 border-l-2 border-dashed pb-4 ${data.isDemo ? 'border-blue-100' : 'border-orange-100'}`}>
                                    <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${data.isDemo ? 'bg-blue-500' : 'bg-orange-500'}`} />
                                    <p className="text-xs font-bold text-gray-900 mb-1">EMS-{id.slice(-4)} reached {Math.round(data.progress)}%</p>
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                        <Clock size={10} /> {data.isDemo ? 'Simulation' : 'Live Data'}
                                    </p>
                                </div>
                            ))}
                            {Object.keys(trackingData).length === 0 && (
                                <div className="text-center py-10">
                                    <p className="text-xs text-gray-400 font-medium italic">Monitor ambulance status here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AmbulanceControl;
