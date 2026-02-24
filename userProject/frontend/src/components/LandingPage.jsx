import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Siren, LogIn, UserPlus, Activity, MapPin, Clock } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col items-center justify-center p-6 font-sans">

            {/* Header Section */}
            <div className="text-center mb-12 animate-fade-in-down">
                <h1 className="text-6xl md:text-7xl font-extrabold mb-4 tracking-tight">
                    <span className="text-primary font-bold drop-shadow-sm">
                        CuraNode
                    </span>
                </h1>
                <p className="text-xl md:text-2xl text-darkText font-light tracking-wide">
                    Integrated Emergency Response System
                </p>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full mb-16">

                {/* Emergency Button */}
                <button
                    onClick={() => navigate('/emergency')}
                    className="group relative flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-primary hover:border-primary"
                >
                    <div className="absolute inset-0 bg-softGray rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="p-4 bg-lightBg rounded-full mb-4 group-hover:bg-softGray transition-colors">
                            <Siren className="w-12 h-12 text-primary animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold text-darkText group-hover:text-primary mb-2">Find Fast Help</h2>
                        <p className="text-darkText text-center text-sm">Immediate emergency assistance & hospital routing</p>
                    </div>
                </button>

                {/* Login Button */}
                <button
                    onClick={() => navigate('/login')}
                    className="group relative flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-primary hover:border-primary"
                >
                    <div className="absolute inset-0 bg-softGray rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="p-4 bg-lightBg rounded-full mb-4 group-hover:bg-softGray transition-colors">
                            <LogIn className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-darkText group-hover:text-primary mb-2">Login</h2>
                        <p className="text-darkText text-center text-sm">Access your patient dashboard & records</p>
                    </div>
                </button>

                {/* Register Button */}
                <button
                    onClick={() => navigate('/register')}
                    className="group relative flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-primary hover:border-primary"
                >
                    <div className="absolute inset-0 bg-softGray rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="p-4 bg-lightBg rounded-full mb-4 group-hover:bg-softGray transition-colors">
                            <UserPlus className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-darkText group-hover:text-primary mb-2">Create Account</h2>
                        <p className="text-darkText text-center text-sm">New user registration & profile setup</p>
                    </div>
                </button>

            </div>

            {/* Features / Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-darkText max-w-4xl w-full">
                <div className="flex flex-col items-center p-4">
                    <MapPin className="w-8 h-8 mb-2 text-primary" />
                    <h3 className="font-semibold text-darkText">Real-time Tracking</h3>
                    <p className="text-sm">Live ambulance & hospital tracking</p>
                </div>
                <div className="flex flex-col items-center p-4">
                    <Activity className="w-8 h-8 mb-2 text-primary" />
                    <h3 className="font-semibold text-darkText">Smart Triage</h3>
                    <p className="text-sm">AI-powered severity assessment</p>
                </div>
                <div className="flex flex-col items-center p-4">
                    <Clock className="w-8 h-8 mb-2 text-primary" />
                    <h3 className="font-semibold text-darkText">Wait Time Estimates</h3>
                    <p className="text-sm">Accurate ER queue predictions</p>
                </div>
            </div>

        </div>
    );
};

export default LandingPage;
