import React, { useState } from 'react';
import axios from 'axios';
import { CalendarCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const QueueBooking = () => {
    const [hospitalId, setHospitalId] = useState('');
    const [priority, setPriority] = useState('normal');
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(null);
    const [error, setError] = useState('');

    const handleBooking = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Mock API call or real one if backend ready
            // Using timeout to simulate network delay for demonstration
            await new Promise(resolve => setTimeout(resolve, 1500));

            const queueNumber = Math.floor(Math.random() * 50) + 1;
            const waitTime = Math.floor(Math.random() * 60) + 5;

            setBooking({
                token: `Q-${queueNumber}`,
                hospital: hospitalId || 'City Gen Hospital', // Fallback name
                wait: `${waitTime} mins`,
                priority: priority.toUpperCase()
            });

        } catch (err) {
            setError('Booking failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-darkText flex items-center gap-2">
                <CalendarCheck className="text-primary" /> Queue Booking System
            </h2>

            {!booking ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-primary max-w-lg mx-auto">
                    <form onSubmit={handleBooking} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-darkText mb-2">Select Hospital</label>
                            <select
                                required
                                value={hospitalId}
                                onChange={(e) => setHospitalId(e.target.value)}
                                className="w-full border rounded-lg p-3 bg-softGray focus:ring-2 focus:ring-orange-500 outline-none"
                            >
                                <option value="">-- Choose Facility --</option>
                                <option value="City General Hospital">City General Hospital</option>
                                <option value="Community Health Center">Community Health Center</option>
                                <option value="Apollo Clinic">Apollo Clinic</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-darkText mb-2">Priority Category</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['normal', 'elderly', 'pregnancy'].map(type => (
                                    <button
                                        type="button"
                                        key={type}
                                        onClick={() => setPriority(type)}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium border capitalize transition-colors
                                            ${priority === type
                                                ? 'bg-primary border-primary text-primary ring-1 ring-orange-500'
                                                : 'bg-white border-primary text-darkText hover:bg-softGray'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-primary text-primary text-sm rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !hospitalId}
                            className="w-full bg-primary hover:bg-primary disabled:bg-softGray disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Book Token'}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-xl shadow-lg border border-primary max-w-lg mx-auto text-center animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-primary" />
                    </div>

                    <h3 className="text-2xl font-bold text-darkText mb-2">Booking Confirmed!</h3>
                    <p className="text-darkText mb-6">Your digital queue token has been generated.</p>

                    <div className="bg-softGray rounded-xl p-6 border border-primary mb-6">
                        <div className="text-xs font-bold text-darkText uppercase tracking-widest mb-2">Token Number</div>
                        <div className="text-4xl font-black text-darkText tracking-tight mb-4">{booking.token}</div>

                        <div className="flex justify-between text-sm border-t pt-4">
                            <span className="text-darkText">Estimated Wait</span>
                            <span className="font-bold text-darkText">{booking.wait}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setBooking(null)}
                        className="text-darkText hover:text-darkText font-medium text-sm underline decoration-gray-300 hover:decoration-gray-800 underline-offset-4"
                    >
                        Book Another Slot
                    </button>
                </div>
            )}
        </div>
    );
};

export default QueueBooking;
