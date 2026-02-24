import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Activity, Clock, Filter, Search } from 'lucide-react';

const HospitalsPage = ({ onBook }) => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState('distance'); // distance, beds, wait

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        setLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const { data } = await axios.post('http://localhost:5000/api/rank-hospitals', {
                        userLat: pos.coords.latitude,
                        userLng: pos.coords.longitude,
                        severity: 1 // Default non-emergency
                    });
                    setHospitals(data);
                } catch (err) {
                    console.error("Error fetching hospitals", err);
                } finally {
                    setLoading(false);
                }
            }, () => setLoading(false));
        }
    };

    const sortedHospitals = [...hospitals].sort((a, b) => {
        if (sortBy === 'distance') return parseFloat(a.distance) - parseFloat(b.distance);
        if (sortBy === 'beds') return b.availableBeds - a.availableBeds;
        if (sortBy === 'wait') return parseInt(a.eta) - parseInt(b.eta);
        return 0;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-darkText">Smart Hospital Finder</h2>
                <div className="flex gap-2">
                    <select
                        className="border rounded-lg px-3 py-2 text-sm bg-white"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="distance">Sort by Distance</option>
                        <option value="beds">Sort by Available Beds</option>
                        <option value="wait">Sort by Wait Time</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-darkText">Locating nearby hospitals...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedHospitals.map(hospital => (
                        <div key={hospital.id} className="bg-white rounded-xl shadow-sm border border-primary p-5 hover:shadow-md transition-shadow">
                            <h3 className="font-bold text-lg text-darkText mb-2">{hospital.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-darkText mb-4">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span>{hospital.distance} km away</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                <div className="bg-lightBg p-2 rounded-lg text-center">
                                    <p className="text-primary font-bold">{hospital.availableBeds}</p>
                                    <p className="text-xs text-primary">Beds Available</p>
                                </div>
                                <div className="bg-lightBg p-2 rounded-lg text-center">
                                    <p className="text-primary font-bold">{hospital.eta}</p>
                                    <p className="text-xs text-primary">Est. Travel Time</p>
                                </div>
                            </div>

                            <button
                                onClick={onBook}
                                className="w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary transition-colors"
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
