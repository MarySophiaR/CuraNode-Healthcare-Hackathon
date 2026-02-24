import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const HospitalOverview = () => {
    const { user } = useContext(AuthContext);

    const getStatusColor = (available, total) => {
        if (!total || total === 0) return 'text-gray-400';
        const percent = (available / total) * 100;
        if (percent < 10) return 'text-red-600'; // Critical
        if (percent < 30) return 'text-orange-500'; // Low
        return 'text-green-600'; // Stable
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="relative h-[400px] w-full rounded-3xl overflow-hidden shadow-xl border border-gray-100 group">
                <img
                    src={user?.heroImage || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2070&auto=format&fit=crop"}
                    alt="City Hospital Building"
                    className="w-full h-full object-cover grayscale-[0.2] contrast-125 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10">
                    <div className="bg-red-600 self-start px-4 py-1 rounded-md mb-4 shadow-lg shadow-red-900/20">
                        <span className="text-white text-xs font-black tracking-widest uppercase">Emergency Medical Center</span>
                    </div>
                    <h2 className="text-white text-5xl font-black tracking-tight drop-shadow-md mb-2">
                        {user?.hospitalName || 'Health Center'}
                    </h2>
                    <p className="text-white/90 text-xl font-bold max-w-2xl drop-shadow-sm leading-relaxed">
                        Dedicated to providing superior healthcare and rapid emergency response, powered by the CuraNode integrated system.
                    </p>
                </div>
            </div>

            {/* Hospital Description */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider font-bold">About This Hospital</h3>
                <p className="text-gray-700 font-medium leading-relaxed">
                    Our hospital is a state-of-the-art medical facility committed to delivering compassionate,
                    evidence-based care to every patient. Equipped with advanced diagnostic technology and
                    specialized treatment units, we offer comprehensive services across emergency medicine,
                    surgery, and critical care.
                </p>
            </div>


            {/* Doctors Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider font-bold">Our Doctors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { name: 'Dr. Sarah Mitchell', specialization: 'Cardiology' },
                        { name: 'Dr. James Okafor', specialization: 'Emergency Medicine' },
                        { name: 'Dr. Priya Nair', specialization: 'Neurology' },
                        { name: 'Dr. Carlos Rivera', specialization: 'Orthopedic Surgery' },
                    ].map((doctor) => (
                        <div key={doctor.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                            <h4 className="text-base font-bold text-gray-800">{doctor.name}</h4>
                            <p className="text-sm font-medium text-gray-500 mt-1">{doctor.specialization}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bed and Resources Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Beds</h3>
                    <p className="text-3xl font-black text-gray-900">{user?.totalBeds || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Available Beds</h3>
                    <p className={`text-3xl font-black ${getStatusColor(user?.availableBeds, user?.totalBeds)}`}>
                        {user?.availableBeds || 0}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Available ICU</h3>
                    <p className={`text-3xl font-black ${getStatusColor(user?.availableICU, user?.icuBeds)}`}>
                        {user?.availableICU || 0}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ambulances</h3>
                    <p className={`text-3xl font-black ${getStatusColor(user?.ambulancesAvailable, user?.ambulancesTotal)}`}>
                        {user?.ambulancesAvailable || 0}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HospitalOverview;
