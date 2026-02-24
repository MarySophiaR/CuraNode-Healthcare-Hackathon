import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Siren, Clock, Locate, MapPin, Activity, Navigation, Phone, ShieldCheck, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

// Fix Leaflet icons
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

// --- Custom Components ---

const CustomToast = ({ message, show, onClose }) => {
    if (!show) return null;
    return (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[2000] flex items-center gap-3 bg-primary text-white px-6 py-4 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white/20 p-2 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="font-bold text-lg">Ambulance Arrived</p>
                <p className="text-xs text-primary opacity-90">Medical assistance is at your location.</p>
            </div>
        </div>
    );
};

const ArrivalCard = ({ driver, eta, status }) => {
    if (!driver) return null;
    const isArrived = status === 'arrived';

    return (
        <div className={`absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-xl overflow-hidden z-[1500] animate-in slide-in-from-top-4 duration-700 border ${isArrived ? 'border-primary' : 'border-primary'}`}>
            <div className={`p-4 text-white ${isArrived ? 'bg-primary' : 'bg-primary'}`}>
                <h2 className="text-lg font-bold flex items-center gap-2">
                    {isArrived ? <CheckCircle2 className="w-5 h-5" /> : <Siren className="w-5 h-5 animate-pulse" />}
                    {isArrived ? 'Medical Team On Site' : 'Ambulance En Route'}
                </h2>
                <p className={`text-sm font-medium mt-1 ${isArrived ? 'text-primary' : 'text-primary'}`}>
                    {isArrived ? 'Assistance has arrived at your location.' : `Estimated Arrival: ${eta?.replace('mins', 'Minutes') || 'Calculating...'}`}
                </p>
            </div>

            {!isArrived && (
                <div className="p-5 bg-white">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-softGray rounded-full flex items-center justify-center border border-primary overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.name}`} alt="Driver" className="w-full h-full" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-darkText">{driver.name}</h3>
                            <p className="text-sm text-darkText font-medium flex items-center gap-1">
                                Paramedic • <span className="text-darkText font-mono bg-softGray px-1 rounded">{driver.vehicleNo}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button className="flex-1 bg-white border border-primary hover:bg-softGray text-darkText py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm text-sm">
                            <Phone className="w-4 h-4" /> Contact Driver
                        </button>
                        <button className="w-12 bg-white border border-primary hover:bg-softGray text-darkText rounded-lg flex items-center justify-center transition-colors shadow-sm">
                            <ShieldCheck className="w-5 h-5" />
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
                return prev + 2; // ~1.5s to 3s hold depending on interval
            });
        }, 60); // 60ms * 50 steps = 3000ms (3s) -> step 2
    };

    const stopHold = () => {
        setIsHolding(false);
        clearInterval(intervalRef.current);
        setProgress(0);
    };

    return (
        <button
            onMouseDown={startHold}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={startHold}
            onTouchEnd={stopHold}
            disabled={isDisabled}
            className={`relative w-full py-4 rounded-xl font-bold text-white overflow-hidden transition-all select-none
                ${isDisabled ? 'bg-softGray cursor-not-allowed text-darkText' : 'bg-primary active:scale-95 shadow-lg'}
            `}
        >
            <div
                className="absolute top-0 bottom-0 left-0 bg-primary transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
                {isHolding && progress < 100 ? `HOLDING... ${Math.round((progress / 100) * 3)}s` : 'HOLD 3 SECONDS TO CONFIRM'}
            </span>
        </button>
    );
};

const EmergencyModal = ({ show, onClose, onConfirm, location }) => {
    const [checked, setChecked] = useState(false);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-t-8 border-primary animate-in zoom-in-95 duration-200">
                <div className="text-center mb-6">
                    <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-darkText mb-2">Emergency Confirmation</h2>
                    <p className="text-darkText text-sm leading-relaxed">
                        This service is for <span className="font-bold text-primary uppercase">REAL medical emergencies only</span>.
                        Misuse may delay help for someone in critical condition.
                        False requests may be logged.
                    </p>
                </div>

                <div className="bg-softGray p-4 rounded-xl mb-6 border border-primary">
                    <p className="text-xs font-bold text-darkText uppercase tracking-wider mb-1">Your Detected Location</p>
                    <div className="flex items-center gap-2 text-darkText font-medium">
                        <MapPin className="w-4 h-4 text-primary" />
                        {location || "Loading location address..."}
                    </div>
                </div>

                <label className="flex items-start gap-3 p-4 bg-primary border border-primary rounded-xl mb-6 cursor-pointer hover:bg-primary/50 transition-colors">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setChecked(e.target.checked)}
                        className="mt-1 w-5 h-5 text-primary rounded border-primary focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-darkText">
                        I confirm this is a real medical emergency and I require immediate assistance.
                    </span>
                </label>

                <HoldToConfirmButton onConfirm={onConfirm} isDisabled={!checked} />

                <button
                    onClick={onClose}
                    className="w-full mt-4 py-3 text-darkText font-medium text-sm hover:text-darkText transition-colors"
                >
                    Cancel Request
                </button>
            </div>
        </div>
    );
};

// Helper component to auto-focus map on route
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

const EmergencyPage = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [severity, setSeverity] = useState(5);
    const [emergencyStatus, setEmergencyStatus] = useState('idle'); // idle, searching, dispatched, enroute, arrived
    const [ambulanceLoc, setAmbulanceLoc] = useState(null);
    const [driverDetails, setDriverDetails] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const socketRef = useRef(null);
    const [activeDispatchId, setActiveDispatchId] = useState(null);
    const [pendingHospital, setPendingHospital] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false); // Track if search was initiated
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')); // Gentle success chime

    // Initial Geolocation
    useEffect(() => {
        if (navigator.geolocation) {
            console.log("Requesting geolocation...");
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    console.log("Location found:", pos.coords);
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => console.error("Location Error:", err),
                { enableHighAccuracy: true }
            );
        }

        // Socket Connection
        socketRef.current = io('http://localhost:5000');
        socketRef.current.on('ambulance_location_update', (loc) => {
            setAmbulanceLoc(loc);
        });
        socketRef.current.on('ambulance_status', (data) => {
            if (data.status === 'dispatched') {
                setDriverDetails(data.driver);
                setEmergencyStatus('enroute');
                // Lock selection to current if not already
                if (!selectedHospital) return;
            }
            if (data.status === 'arrived') {
                setEmergencyStatus('arrived');
                setShowToast(true);
                audioRef.current.play().catch(e => console.log('Audio play failed', e));
                setTimeout(() => setShowToast(false), 5000);
            }
        });

        return () => socketRef.current.disconnect();
    }, []);

    const [loading, setLoading] = useState(false); // Ensure loading state is active

    // 4. Create function handleFindHelp
    const handleFindHelp = async () => {
        // Removed early return conditions as requested logic cleanup

        setHospitals([]);
        setSelectedHospital(null);
        setActiveDispatchId(null);
        setAmbulanceLoc(null);
        setLoading(true);
        setSearchPerformed(true);
        setEmergencyStatus('searching');

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            setLoading(false);
            return;
        }

        // 1. Get user's live location
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                console.log("Location found:", latitude, longitude);

                // Update user location state
                setUserLocation({ lat: latitude, lng: longitude });

                try {
                    // Call API: /api/rank-hospitals (Using existing backend route)
                    const { data } = await axios.post('http://localhost:5000/api/rank-hospitals', {
                        userLat: latitude,    // Mapping to backend expectation
                        userLng: longitude,   // Mapping to backend expectation
                        severity
                    });

                    // Sort and Display
                    console.log("Hospitals found:", data.length);
                    setHospitals(data);

                    // 2. Do NOT auto-dispatch yet. Just select default for map view if desired.
                    if (data.length > 0) {
                        setSelectedHospital(data[0]);
                    }
                } catch (error) {
                    console.error("API Error:", error);
                    alert("Failed to fetch hospitals. Ensure backend is running.");
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                console.error("Location error:", error);
                alert("Unable to retrieve your location.");
                setLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const initiateDispatch = (hospital) => {
        if (status === 'DISPATCHED') return;
        setPendingHospital(hospital);
        setShowConfirmModal(true);
    };

    const handleConfirmDispatch = () => {
        if (!pendingHospital) return;

        setShowConfirmModal(false);
        setEmergencyStatus('dispatched'); // Will trigger socket and move to enroute
        setActiveDispatchId(pendingHospital.id);

        socketRef.current.emit('request_ambulance', {
            hospitalId: pendingHospital.id,
            hospitalLat: pendingHospital.lat,
            hospitalLng: pendingHospital.lng,
            userLat: userLocation.lat,
            userLng: userLocation.lng
        });
    };

    const handleCancel = () => {
        setEmergencyStatus('idle');
        setActiveDispatchId(null);
        setAmbulanceLoc(null);
        setDriverDetails(null);
        setShowToast(false);
        socketRef.current.emit('cancel_ambulance');
    };

    // Calculate Bounds for Map
    const mapBounds = selectedHospital && userLocation ? [
        [userLocation.lat, userLocation.lng],
        [selectedHospital.lat, selectedHospital.lng]
    ] : null;

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-white overflow-hidden">

            {/* Left Column: Controls & List */}
            <div className="w-full lg:w-1/3 flex flex-col border-r border-primary bg-softGray/50 shadow-md z-10">

                {/* Header / Emergency Status */}
                <div className="p-6 bg-white border-b border-primary">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-darkText flex items-center gap-2">
                            <Siren className="text-primary animate-pulse" /> Emergency Response
                        </h2>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${emergencyStatus === 'enroute' || emergencyStatus === 'dispatched' ? 'bg-primary text-primary border-primary' :
                            emergencyStatus === 'searching' ? 'bg-primary text-primary border-primary' :
                                emergencyStatus === 'arrived' ? 'bg-primary text-primary border-primary' :
                                    'bg-softGray text-darkText border-primary'
                            }`}>
                            {emergencyStatus === 'enroute' ? 'RESPONDING' :
                                emergencyStatus === 'arrived' ? 'ARRIVED' :
                                    emergencyStatus.toUpperCase()}
                        </span>
                    </div>

                    {/* Arrival UI Overlay */}
                    {(emergencyStatus === 'dispatched' || emergencyStatus === 'enroute') && driverDetails && (
                        <div className="mb-4 p-4 bg-lightBg border border-primary rounded-xl flex items-center justify-between animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                                <span className="text-primary font-semibold text-sm">Dispatching Unit...</span>
                            </div>
                            <span className="text-xs font-mono text-primary">ID: {driverDetails.vehicleNo}</span>
                        </div>
                    )}

                    {['idle', 'searching'].includes(emergencyStatus) ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-darkText uppercase tracking-wider mb-3 block">
                                    Incident Severity Level
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { val: 2, label: 'Low', color: 'hover:bg-lightBg border-primary text-primary' },
                                        { val: 5, label: 'Med', color: 'hover:bg-yellow-100 border-yellow-200 text-yellow-700' },
                                        { val: 8, label: 'High', color: 'hover:bg-lightBg border-primary text-primary' },
                                        { val: 10, label: 'Crit', color: 'hover:bg-lightBg border-primary text-primary' }
                                    ].map((level) => (
                                        <button
                                            key={level.val}
                                            onClick={() => setSeverity(level.val)}
                                            className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all
                                                ${severity === level.val
                                                    ? `ring-2 ring-offset-1 ring-blue-500 shadow-md scale-105 ${level.color.replace('hover:', '')}`
                                                    : `bg-white text-darkText ${level.color}`
                                                }
                                            `}
                                        >
                                            {level.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleFindHelp}
                                disabled={loading}
                                className="w-full h-11 bg-primary hover:bg-primaryDark text-white font-medium rounded-lg shadow-sm transition-all focus:ring-4 focus:ring-lightBg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Locate className="w-4 h-4" />}
                                {loading ? 'Locating Specialists...' : 'Find Nearest Help'}
                            </button>
                        </div>
                    ) : (
                        <div className={`border rounded-lg p-4 animate-in fade-in slide-in-from-top-2 
                            ${emergencyStatus === 'arrived' ? 'bg-lightBg border-primary' : 'bg-lightBg border-primary'}`}>

                            <h3 className={`font-bold mb-1 flex items-center gap-2 
                                ${emergencyStatus === 'arrived' ? 'text-primary' : 'text-primary'}`}>
                                {emergencyStatus === 'arrived' ? <CheckCircle2 className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                                {emergencyStatus === 'arrived' ? 'Medical Team On Site' : 'Ambulance En Route'}
                            </h3>

                            <p className={`text-sm mb-2 ${emergencyStatus === 'arrived' ? 'text-primary' : 'text-primary'}`}>
                                {emergencyStatus === 'arrived'
                                    ? 'Emergency responders have reached your location.'
                                    : <>En route from <strong>{selectedHospital?.name}</strong></>
                                }
                            </p>

                            {emergencyStatus !== 'arrived' && (
                                <button className="text-xs text-primary font-semibold hover:underline" onClick={handleCancel}>Cancel Request</button>
                            )}
                        </div>
                    )}
                </div>

                {/* Hospital List Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">

                    {!searchPerformed && !loading && (
                        <div className="flex flex-col items-center justify-center h-48 text-darkText text-sm opacity-60">
                            <Activity className="w-12 h-12 mb-3 text-darkText" />
                            <p>Ready to find help.</p>
                            <p className="text-xs">Click "Find Nearest Help" to start.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center h-48 text-primary text-sm animate-pulse">
                            <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                            <p>Locating nearest hospitals...</p>
                        </div>
                    )}

                    {searchPerformed && !loading && hospitals.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-darkText text-sm">
                            <MapPin className="w-8 h-8 mb-2 opacity-20" />
                            <p>No hospitals found nearby.</p>
                            <p className="text-xs">Adjust severity and ensure location is on.</p>
                        </div>
                    )}

                    {hospitals.map((hospital, idx) => (<div
                        key={hospital.id}
                        onClick={() => !['dispatched', 'enroute', 'arrived'].includes(emergencyStatus) && setSelectedHospital(hospital)}
                        className={`relative p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md
                                    ${selectedHospital?.id === hospital.id
                                ? 'bg-lightBg border-primary shadow-sm ring-1 ring-blue-500'
                                : 'bg-white border-primary hover:border-primary'
                            }
                                    ${['dispatched', 'enroute', 'arrived'].includes(emergencyStatus) && activeDispatchId !== hospital.id ? 'opacity-50 cursor-not-allowed bg-softGray' : ''}
                                `}
                    >
                        {idx === 0 && emergencyStatus !== 'arrived' && (
                            <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
                                Best Match
                            </span>
                        )}

                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-semibold text-darkText text-sm">{hospital.name}</h3>
                            <span className="text-xs font-mono text-darkText">{hospital.distance} km</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-darkText mt-2">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-primary" />
                                <span className="font-medium text-darkText">{hospital.eta}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Activity className="w-3 h-3 text-primary" />
                                <span className="font-medium text-darkText">{hospital.availableBeds} Beds</span>
                            </div>
                        </div>

                        {/* Dispatch Button - ONLY for Best Match (Index 0) and when NOT dispatched */}
                        {idx === 0 && !['dispatched', 'enroute', 'arrived'].includes(emergencyStatus) && (
                            <button
                                onClick={(e) => { e.stopPropagation(); initiateDispatch(hospital); }}
                                className="mt-3 w-full py-2 bg-primary hover:bg-primaryDark text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Siren className="w-3 h-3" /> Dispatch Immediately
                            </button>
                        )}

                        {/* Status Text for others or when dispatched */}
                        {idx !== 0 && !['dispatched', 'enroute', 'arrived'].includes(emergencyStatus) && (
                            <div className="mt-3 w-full py-2 text-center text-xs text-darkText font-medium bg-softGray rounded-lg border border-primary cursor-not-allowed">
                                Alternative Option
                            </div>
                        )}

                        {['dispatched', 'enroute'].includes(emergencyStatus) && activeDispatchId === hospital.id && (
                            <div className="mt-3 w-full py-2 text-center text-xs text-primary font-bold bg-primary rounded-lg animate-pulse border border-primary">
                                ACTIVE DISPATCH
                            </div>
                        )}

                        {emergencyStatus === 'arrived' && activeDispatchId === hospital.id && (
                            <div className="mt-3 w-full py-2 text-center text-xs text-white font-bold bg-primary rounded-lg shadow-sm">
                                Responded
                            </div>
                        )}

                        {['dispatched', 'enroute', 'arrived'].includes(emergencyStatus) && activeDispatchId !== hospital.id && (
                            <div className="mt-3 w-full py-2 text-center text-xs text-darkText font-medium rounded-lg">
                                Locked
                            </div>
                        )}
                    </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Interactive Map */}
            <div className="flex-1 h-full bg-softGray relative w-full">
                {userLocation ? (
                    <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }} className="w-full h-full">
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />
                        <MapUpdater center={[userLocation.lat, userLocation.lng]} bounds={mapBounds} />

                        {/* User Marker */}
                        <Marker position={[userLocation.lat, userLocation.lng]} icon={blueIcon}>
                            <Popup className="font-sans text-xs font-bold">You are here</Popup>
                        </Marker>

                        {/* Hospital Markers */}
                        {hospitals.map(h => (
                            <Marker
                                key={h.id}
                                position={[h.lat, h.lng]}
                                icon={redIcon}
                                eventHandlers={{ click: () => setSelectedHospital(h) }}
                            >
                                <Popup>
                                    <div className="text-xs">
                                        <strong>{h.name}</strong><br />
                                        {h.distance} km • {h.eta}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {/* Route Line */}
                        {selectedHospital && (
                            <Polyline
                                positions={[
                                    [userLocation.lat, userLocation.lng],
                                    [selectedHospital.lat, selectedHospital.lng]
                                ]}
                                color={emergencyStatus === 'arrived' ? '#22c55e' : '#3b82f6'}
                                weight={4}
                                opacity={0.7}
                                dashArray="10, 10"
                            />
                        )}

                        {/* Ambulance Marker */}
                        {ambulanceLoc && (
                            <Marker position={[ambulanceLoc.lat, ambulanceLoc.lng]} icon={goldIcon}>
                                <Popup>🚑 Ambulance</Popup>
                            </Marker>
                        )}

                    </MapContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-softGray text-darkText text-sm">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-primary border-t-blue-500 rounded-full animate-spin" />
                            Getting your location...
                        </div>
                    </div>
                )}

                {/* Map Overlay Stats */}
                <CustomToast show={showToast} onClose={() => setShowToast(false)} />

                <EmergencyModal
                    show={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={handleConfirmDispatch}
                    location={userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : "Detecting..."}
                />

                {(emergencyStatus === 'dispatched' || emergencyStatus === 'enroute') && driverDetails && (
                    <ArrivalCard driver={driverDetails} eta={selectedHospital?.eta || '5 mins'} status={emergencyStatus} />
                )}

                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-1 px-2 rounded-lg shadow-sm border border-primary text-[10px] text-darkText z-[1000]">
                    Map Data © OpenStreetMap
                </div>
            </div>

        </div>
    );
};

export default EmergencyPage;
