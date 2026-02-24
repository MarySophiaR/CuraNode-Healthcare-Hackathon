import React from 'react';

const Branding = ({ size = 'base', showSubtitle = false, centered = false, className = '' }) => {
    const textSizes = {
        sm: 'text-lg',
        base: 'text-2xl',
        lg: 'text-4xl',
        xl: 'text-5xl',
        '2xl': 'text-6xl'
    };

    return (
        <div className={`flex flex-col ${centered ? 'items-center text-center' : ''} ${className}`}>
            <h1 className={`${textSizes[size]} font-black tracking-tight flex items-center gap-0 leading-none`}>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6FA3B3] via-[#5BA8B3] to-[#4F8C9D] pb-1">
                    CuraNode
                </span>
            </h1>
            {showSubtitle && (
                <p className="text-gray-400 font-bold text-sm mt-1 tracking-tight">
                    Integrated Emergency Response System
                </p>
            )}
        </div>
    );
};

export default Branding;
