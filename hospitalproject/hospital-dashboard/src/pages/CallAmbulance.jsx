import React, { useState, useEffect, useRef, useContext } from 'react';
import API from '../services/api';
import SocketContext from '../context/SocketContext';
import AuthContext from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Siren, Clock, Locate, MapPin, Activity, Navigation, Phone, ShieldCheck, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

// Leaflet Icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const goldIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const MapUpdater = ({ center, bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (center) {
            map.flyTo(center, 13);
        }
    }, [center, bounds, map]);
    return null;
};

const CallAmbulance = () => {
    const { socket } = useContext(SocketContext);
    const { user } = useContext(AuthContext);
    const [userLocation, setUserLocation] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [severity, setSeverity] = useState(3);
    const [emergencyStatus, setEmergencyStatus] = useState('idle');
    const [ambulanceLoc, setAmbulanceLoc] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
        }

        if (socket) {
            socket.on('ambulanceDispatched', (data) => {
                setEmergencyStatus('enroute');
            });
            socket.on('ambulanceLocationUpdate', (data) => {
                setAmbulanceLoc(data.coords);
            });
            socket.on('ambulanceStatus', (data) => {
                if (data.status === 'arrived') setEmergencyStatus('arrived');
            });
        }

        return () => {
            if (socket) {
                socket.off('ambulanceDispatched');
                socket.off('ambulanceLocationUpdate');
                socket.off('ambulanceStatus');
            }
        };
    }, [socket]);

    const handleFindHelp = async () => {
        setLoading(true);
        try {
            const { data } = await API.post('/rank-hospitals', {
                userLat: userLocation.lat,
                userLng: userLocation.lng,
                severity
            });
            setHospitals(data);
            if (data.length > 0) setSelectedHospital(data[0]);
            setEmergencyStatus('searching');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestAmbulance = () => {
        if (!selectedHospital || !socket) return;
        setEmergencyStatus('dispatched');
        socket.emit('emergencyRequest', {
            selectedHospitalId: selectedHospital.id,
            userLocation: { type: 'Point', coordinates: [userLocation.lng, userLocation.lat] },
            severity
        });
    };

    const mapBounds = selectedHospital && userLocation ? [
        [userLocation.lat, userLocation.lng],
        [selectedHospital.lat, selectedHospital.lng]
    ] : null;

    return (
        <div className="h-[calc(100vh-160px)] flex flex-col lg:flex-row bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            {/* Sidebar Controls */}
            <div className="w-full lg:w-1/3 p-6 border-r border-gray-50 flex flex-col overflow-y-auto">
                <div className="mb-6">
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Emergency Help</h2>
                    <p className="text-gray-500 text-sm font-medium">Find and request the nearest medical assistance.</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Severity Level</label>
                        <div className="grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map(lv => (
                                <button
                                    key={lv}
                                    onClick={() => setSeverity(lv)}
                                    className={`h-10 rounded-xl font-bold transition-all ${severity === lv ? 'bg-[#6FA3B3] text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                >
                                    {lv}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleFindHelp}
                        disabled={loading || !userLocation}
                        className="w-full h-14 bg-[#6FA3B3] hover:bg-[#4F8C9D] text-white font-black rounded-2xl transition-all shadow-lg shadow-[#EAF3F6] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Locate className="w-5 h-5" />}
                        Find Nearest Hospital
                    </button>

                    <div className="space-y-3">
                        {hospitals.map(h => (
                            <div
                                key={h.id}
                                onClick={() => setSelectedHospital(h)}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedHospital?.id === h.id ? 'border-[#6FA3B3] bg-[#EAF3F6]/30' : 'border-gray-50 hover:border-gray-100'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900">{h.name}</h3>
                                    <span className="text-xs font-bold text-[#6FA3B3] bg-white px-2 py-1 rounded-lg border border-gray-100">{h.distance} km</span>
                                </div>
                                <div className="flex gap-4 text-xs font-bold text-gray-400">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {h.eta}</span>
                                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {h.availableBeds} Beds</span>
                                </div>
                                {selectedHospital?.id === h.id && emergencyStatus === 'searching' && (
                                    <button
                                        onClick={handleRequestAmbulance}
                                        className="mt-4 w-full h-10 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                                    >
                                        <Siren className="w-4 h-4" /> Request Ambulance
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 bg-gray-50 relative">
                {userLocation ? (
                    <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        <MapUpdater center={[userLocation.lat, userLocation.lng]} bounds={mapBounds} />
                        <Marker position={[userLocation.lat, userLocation.lng]} icon={blueIcon}><Popup>You</Popup></Marker>
                        {hospitals.map(h => (
                            <Marker key={h.id} position={[h.lat, h.lng]} icon={redIcon}><Popup>{h.name}</Popup></Marker>
                        ))}
                        {ambulanceLoc && (
                            <Marker position={[ambulanceLoc.lat, ambulanceLoc.lng]} icon={goldIcon}><Popup>Ambulance</Popup></Marker>
                        )}
                        {selectedHospital && (
                            <Polyline positions={[[userLocation.lat, userLocation.lng], [selectedHospital.lat, selectedHospital.lng]]} color="#6FA3B3" dashArray="5, 10" />
                        )}
                    </MapContainer>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#6FA3B3]" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallAmbulance;
