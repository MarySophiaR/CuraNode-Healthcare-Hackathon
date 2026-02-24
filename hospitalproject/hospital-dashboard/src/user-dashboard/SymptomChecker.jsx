import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Stethoscope, Heart, ShieldAlert, ArrowRight } from 'lucide-react';

const C = {
    primary: '#6FA3B3',
    primaryDark: '#4F8C9D',
    lightBg: '#EAF3F6',
    softGray: '#F5F7F8',
    darkText: '#1F2D3D',
};

const symptoms = [
    { id: 'fever', label: 'High Fever' },
    { id: 'cough', label: 'Persistent Cough' },
    { id: 'chest_pain', label: 'Chest Pressure' },
    { id: 'weakness', label: 'Severe Weakness' },
    { id: 'sore_throat', label: 'Throat Irritation' },
    { id: 'headache', label: 'Severe Migraine' },
    { id: 'breathing', label: 'Shortness of Breath' },
];

const SymptomChecker = () => {
    const [selected, setSelected] = useState({});
    const [result, setResult] = useState(null);

    const toggle = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

    const analyse = () => {
        let condition = 'Mild Condition';
        let action = 'MONITOR';
        let severity = 'low';

        if (selected.chest_pain || selected.breathing) {
            condition = 'Immediate Assistance Needed'; action = 'EMERGENCY'; severity = 'high';
        } else if ((selected.fever && selected.cough) || selected.headache) {
            condition = 'Potential Viral Flu'; action = 'CONSULT'; severity = 'medium';
        } else if (Object.values(selected).filter(Boolean).length >= 3) {
            condition = 'Observation Recommended'; action = 'CONSULT'; severity = 'medium';
        }

        setResult({ condition, action, severity });
    };

    const anySelected = Object.values(selected).some(Boolean);

    return (
        <div style={{ padding: '2rem', maxWidth: 860, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '2rem' }}>
                <div style={{ width: 48, height: 48, background: C.primary, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(111,163,179,0.3)', flexShrink: 0 }}>
                    <Stethoscope size={24} color="#fff" />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.darkText, margin: 0 }}>AI Symptom Checker</h2>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '4px 0 0' }}>Preliminary Smart Analysis</p>
                </div>
            </div>

            {/* Card */}
            <div style={{ background: '#fff', borderRadius: 28, padding: '2.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0' }}>

                {/* Symptom grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '2rem' }}>
                    {symptoms.map(sym => {
                        const isOn = !!selected[sym.id];
                        return (
                            <label
                                key={sym.id}
                                onClick={() => toggle(sym.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '16px 18px', borderRadius: 16, cursor: 'pointer',
                                    border: isOn ? `2px solid ${C.primary}` : '2px solid #e5e7eb',
                                    background: isOn ? C.lightBg : '#fff',
                                    transition: 'all 0.18s',
                                    userSelect: 'none',
                                }}
                                onMouseEnter={e => { if (!isOn) { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = C.softGray; } }}
                                onMouseLeave={e => { if (!isOn) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; } }}
                            >
                                {/* Checkbox visual */}
                                <div style={{
                                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                    border: `2px solid ${isOn ? C.primary : '#d1d5db'}`,
                                    background: isOn ? C.primary : '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s',
                                }}>
                                    {isOn && <CheckCircle size={14} color="#fff" />}
                                </div>
                                <input type="checkbox" checked={isOn} onChange={() => toggle(sym.id)} style={{ display: 'none' }} />
                                <span style={{
                                    fontWeight: 800, fontSize: '0.78rem',
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                    color: isOn ? C.primaryDark : '#6b7280',
                                    transition: 'color 0.15s',
                                }}>
                                    {sym.label}
                                </span>
                            </label>
                        );
                    })}
                </div>

                {/* Analyse button */}
                <button
                    onClick={analyse}
                    disabled={!anySelected}
                    style={{
                        width: '100%', padding: '16px', borderRadius: 16,
                        background: anySelected ? C.primary : '#e5e7eb',
                        border: 'none', color: anySelected ? '#fff' : '#aaa',
                        fontWeight: 800, fontSize: '0.85rem',
                        textTransform: 'uppercase', letterSpacing: '0.15em',
                        cursor: anySelected ? 'pointer' : 'not-allowed',
                        boxShadow: anySelected ? '0 6px 20px rgba(111,163,179,0.3)' : 'none',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { if (anySelected) e.currentTarget.style.background = C.primaryDark; }}
                    onMouseLeave={e => { if (anySelected) e.currentTarget.style.background = C.primary; }}
                >
                    Run Smart Analysis
                </button>
            </div>

            {/* Result */}
            {result && (
                <div style={{
                    marginTop: '2rem', padding: '2.5rem', borderRadius: 28,
                    background: '#fff',
                    border: `2px solid ${result.severity === 'high' ? '#ef4444' : C.primary}`,
                    boxShadow: result.severity === 'high' ? '0 8px 30px rgba(239,68,68,0.12)' : '0 8px 30px rgba(111,163,179,0.15)',
                    display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap',
                }}>
                    {/* Icon */}
                    <div style={{
                        width: 72, height: 72, borderRadius: 20, flexShrink: 0,
                        background: result.severity === 'high' ? '#ef4444' : C.primary,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: result.severity === 'high' ? '0 6px 20px rgba(239,68,68,0.3)' : '0 6px 20px rgba(111,163,179,0.3)',
                    }}>
                        {result.severity === 'high'
                            ? <ShieldAlert size={36} color="#fff" />
                            : <Heart size={36} color="#fff" />
                        }
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                        <h3 style={{
                            fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.75rem',
                            color: result.severity === 'high' ? '#ef4444' : C.primary,
                        }}>
                            {result.condition}
                        </h3>
                        <p style={{ color: '#666', fontWeight: 600, lineHeight: 1.6, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            {result.action === 'EMERGENCY'
                                ? 'Alert! Your symptoms match critical indicators. Activate emergency response immediately.'
                                : result.action === 'CONSULT'
                                    ? 'Your symptoms suggest a medical consultation is required. Please book an appointment.'
                                    : 'Symptoms appear non-critical at this stage. Continue to monitor and seek help if they intensify.'
                            }
                        </p>

                        <button style={{
                            padding: '12px 28px', borderRadius: 12,
                            background: result.severity === 'high' ? '#ef4444' : C.primary,
                            border: 'none', color: '#fff',
                            fontWeight: 800, fontSize: '0.78rem',
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                            transition: 'opacity 0.2s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            {result.action === 'EMERGENCY' ? 'Activate Emergency Response' : 'Find Nearby Help'}
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SymptomChecker;
