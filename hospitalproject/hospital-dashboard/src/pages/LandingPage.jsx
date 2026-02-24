import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Siren, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import Branding from '../components/Branding';

const LandingPage = () => {
    const navigate = useNavigate();

    const cards = [
        {
            id: 'emergency',
            title: 'Emergency',
            subtitle: 'Immediate medical assistance',
            icon: Siren,
            color: '#b91c1c',
            bg: '#fee2e2',
            action: () => navigate('/sos'),
            description: 'Get immediate help for critical situations and dispatch the nearest ambulance.'
        },
        {
            id: 'login',
            title: 'Login',
            subtitle: 'Access your dashboard',
            icon: LogIn,
            color: '#6FA3B3',
            bg: '#EAF3F6',
            action: () => navigate('/login'),
            description: 'Sign in to manage your medical records, bookings, or hospital operations.'
        },
        {
            id: 'register',
            title: 'Create Account',
            subtitle: 'Join CuraNode network',
            icon: UserPlus,
            color: '#4F8C9D',
            bg: '#F5F7F8',
            action: () => navigate('/register'),
            description: 'Register as a user or a hospital to access specialized healthcare services.'
        }
    ];

    return (
        <div className="min-h-screen bg-[#EAF3F6] flex flex-col items-center justify-center p-6 font-['Inter',_sans-serif]">
            <div className="mb-12">
                <Branding size="lg" showSubtitle centered />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
                {cards.map((card) => (
                    <div
                        key={card.id}
                        onClick={card.action}
                        className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-xl hover:translate-y-[-8px] flex flex-col group"
                    >
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110"
                            style={{ backgroundColor: card.bg }}
                        >
                            <card.icon size={32} color={card.color} />
                        </div>

                        <div className="mb-2">
                            <h2 className="text-2xl font-black text-gray-900 leading-tight">{card.title}</h2>
                            <p className="text-[#6FA3B3] font-bold text-sm tracking-wide">{card.subtitle}</p>
                        </div>

                        <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8 flex-grow">
                            {card.description}
                        </p>

                        <div className="flex items-center gap-2 font-black text-sm transition-all duration-300 group-hover:gap-4" style={{ color: card.color }}>
                            GET STARTED
                            <ArrowRight size={18} />
                        </div>
                    </div>
                ))}
            </div>

            <p className="mt-16 text-gray-400 text-sm font-bold">
                Your Health, Our Priority. Providing 24/7 Integrated Emergency Care.
            </p>
        </div>
    );
};

export default LandingPage;
