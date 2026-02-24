import { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import { Save, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';
import { io } from 'socket.io-client';

const BedManagement = () => {
    const { user } = useContext(AuthContext);

    // Form State
    const [resources, setResources] = useState({
        availableBeds: 0,
        availableICU: 0,
        availableOxygen: 0,
        bloodAvailable: false,
        avgWaitTime: 0,
        ambulancesAvailable: 0
    });

    // Read-only Totals
    const [totals, setTotals] = useState({
        totalBeds: 0,
        icuBeds: 0,
        ambulancesTotal: 0
    });

    // UI States
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const fetchHospitalData = async () => {
        try {
            const { data } = await API.get('/auth/me');
            console.log('Backend Data Check:', data); // LOOK AT THIS IN CONSOLE

            // Explicitly map keys if backend uses snake_case
            const totalBeds = data.totalBeds || data.total_beds || 0;
            const icuBeds = data.icuBeds || data.icu_beds || 0;
            const ambulancesTotal = data.ambulancesTotal || data.ambulances_total || 0;

            setResources({
                availableBeds: Number(data.availableBeds || data.available_beds || 0),
                availableICU: Number(data.availableICU || data.available_icu || 0),
                availableOxygen: Number(data.availableOxygen || data.available_oxygen || 0),
                bloodAvailable: !!(data.bloodAvailable || data.blood_available),
                avgWaitTime: Number(data.avgWaitTime || data.avg_wait_time || 0),
                ambulancesAvailable: Number(data.ambulancesAvailable || data.ambulances_available || 0)
            });

            setTotals({
                totalBeds: Number(totalBeds),
                icuBeds: Number(icuBeds),
                ambulancesTotal: Number(ambulancesTotal)
            });
        } catch (err) {
            setError('Failed to load hospital data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHospitalData();

        const socket = io('http://localhost:5000');

        socket.on('connect', () => {
            if (user?._id) socket.emit('registerHospital', user._id);
        });

        socket.on('hospitalUpdate', (data) => {
            // IMPORTANT: Only update if the ID matches and we aren't currently editing
            if (data.hospitalId === user?._id && !saving) {
                setResources(prev => ({
                    ...prev,
                    availableBeds: data.availableBeds,
                    availableICU: data.availableICU,
                    availableOxygen: data.availableOxygen,
                    ambulancesAvailable: data.ambulancesAvailable
                }));

                // Also update totals in case the hospital admin changed capacity elsewhere
                setTotals({
                    totalBeds: data.totalBeds,
                    icuBeds: data.icuBeds,
                    ambulancesTotal: data.ambulancesTotal
                });
            }
        });

        return () => socket.disconnect();
        // Remove 'saving' from here to prevent constant reconnects
    }, [user?._id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setResources(prev => ({ ...prev, [name]: checked }));
            return;
        }

        // Convert to number immediately to strip leading zeros
        // If user clears the input, we use 0
        const val = value === '' ? 0 : parseInt(value, 10);

        setResources(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        // Construct the payload to explicitly "Unlock" the capacity
        const payload = {
            ...resources,
            totalBeds: totals.totalBeds,
            icuBeds: totals.icuBeds,
            ambulancesTotal: totals.ambulancesTotal,
            oxygenUnits: resources.availableOxygen > totals.oxygenUnits ? resources.availableOxygen : (totals.oxygenUnits || 50)
        };

        try {
            const response = await API.patch('/auth/update-resources', payload);
            console.log("Server Response:", response.data);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            await fetchHospitalData();
        } catch (err) {
            // If this still fails, your backend controller is likely 
            // blocking 'total' fields from being updated.
            setError(err.response?.data?.message || 'Server still rejecting totals');
        } finally {
            setSaving(false);
        }
    };;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                <RefreshCcw className="w-8 h-8 animate-spin mb-3 text-[#6FA3B3]" />
                <p>Loading hospital resources...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Bed & Resource Management</h1>
                {success && (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-200 animate-fade-in">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Resources updated successfully</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                {error && (
                    <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-3 border border-red-100">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* General Beds */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Available General Beds</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="availableBeds"
                                value={resources.availableBeds === 0 ? '' : resources.availableBeds}
                                placeholder="0"
                                onChange={handleChange}
                                disabled={saving}
                                className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#EAF3F6] focus:border-[#6FA3B3]/30 transition-all font-medium text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                            />
                            {/*<span className="absolute right-4 top-3.5 text-sm font-medium text-gray-500">
                                / {totals.totalBeds} Total
                            </span>*/}
                        </div>
                    </div>

                    {/* ICU Beds */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Available ICU Beds</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="availableICU"
                                value={resources.availableICU === 0 ? '' : resources.availableICU}
                                placeholder="0"
                                onChange={handleChange}
                                disabled={saving}
                                className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#EAF3F6] focus:border-[#6FA3B3]/30 transition-all font-medium text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                            />
                            {/*<span className="absolute right-4 top-3.5 text-sm font-medium text-gray-500">
                                / {totals.icuBeds} Total
                            </span>*/}
                        </div>
                    </div>

                    {/* Oxygen Units */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Available Oxygen Units</label>
                        <input
                            type="number"
                            inputMode="numeric"
                            name="availableOxygen"
                            value={resources.availableOxygen === 0 ? '' : resources.availableOxygen}
                            placeholder="0"
                            onChange={handleChange}
                            disabled={saving}
                            className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#EAF3F6] focus:border-[#6FA3B3]/30 transition-all font-medium text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                    </div>

                    {/* Ambulances */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Available Ambulances</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="ambulancesAvailable"
                                value={resources.ambulancesAvailable === 0 ? '' : resources.ambulancesAvailable}
                                placeholder="0"
                                onChange={handleChange}
                                disabled={saving}
                                className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#EAF3F6] focus:border-[#6FA3B3]/30 transition-all font-medium text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                            />
                            {/*<span className="absolute right-4 top-3.5 text-sm font-medium text-gray-500">
                                / {totals.ambulancesTotal} Total
                            </span>*/}
                        </div>
                    </div>

                    {/* Wait Time */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Avg Wait Time (mins)</label>
                        <input
                            type="number"
                            name="avgWaitTime"
                            value={resources.avgWaitTime === 0 ? '' : resources.avgWaitTime}
                            placeholder="0"
                            onChange={handleChange}
                            disabled={saving}
                            className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#EAF3F6] focus:border-[#6FA3B3]/30 transition-all font-medium text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                    </div>

                    {/* Blood Availability Toggle */}
                    <div className="flex items-center h-full pt-6">
                        <label className="flex items-center cursor-pointer select-none group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    name="bloodAvailable"
                                    checked={resources.bloodAvailable}
                                    onChange={handleChange}
                                    disabled={saving}
                                    className="sr-only"
                                />
                                <div className={`block w-14 h-8 rounded-full transition-colors ${resources.bloodAvailable ? 'bg-red-500' : 'bg-gray-200 group-hover:bg-gray-300'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ${resources.bloodAvailable ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                            <div className="ml-3 font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                                Blood Bank Available
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-50">
                    <button
                        type="submit"
                        disabled={saving}
                        className="h-12 px-8 bg-[#6FA3B3] hover:bg-[#4F8C9D] text-white font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-[#EAF3F6] disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-xl transform active:scale-95"
                    >
                        {saving ? (
                            <>
                                <RefreshCcw className="w-4 h-4 animate-spin" />
                                Saving Changes...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Updates
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BedManagement;
