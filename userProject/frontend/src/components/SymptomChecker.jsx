import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Stethoscope } from 'lucide-react';

const SymptomChecker = () => {
    const [selectedSymptoms, setSelectedSymptoms] = useState({});
    const [result, setResult] = useState(null);

    const symptoms = [
        { id: 'fever', label: 'Fever (High Temperature)' },
        { id: 'cough', label: 'Persistent Cough' },
        { id: 'chest_pain', label: 'Chest Pain or Tightness' },
        { id: 'weakness', label: 'Severe Weakness' },
        { id: 'sore_throat', label: 'Sore Throat' },
        { id: 'headache', label: 'Severe Headache' },
        { id: 'breathing', label: 'Difficulty Breathing' }
    ];

    const toggleSymptom = (id) => {
        setSelectedSymptoms(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const checkSymptoms = () => {
        let condition = 'Mild Condition';
        let action = 'MONITOR';
        let severity = 'low';

        if (selectedSymptoms.chest_pain || selectedSymptoms.breathing) {
            condition = 'Use Emergency Services';
            action = 'EMERGENCY';
            severity = 'high';
        } else if ((selectedSymptoms.fever && selectedSymptoms.cough) || selectedSymptoms.headache) {
            condition = 'Viral Infection / Flu';
            action = 'CONSULT';
            severity = 'medium';
        } else if (Object.values(selectedSymptoms).filter(Boolean).length >= 3) {
            condition = 'General Checkup Advised';
            action = 'CONSULT';
            severity = 'medium';
        }

        setResult({ condition, action, severity });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-darkText">Symptom Checker</h2>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-primary max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {symptoms.map(sym => (
                        <label
                            key={sym.id}
                            className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all
                                ${selectedSymptoms[sym.id] ? 'bg-primary border-primary ring-1 ring-purple-200' : 'hover:bg-softGray border-primary'}`}
                        >
                            <input
                                type="checkbox"
                                checked={!!selectedSymptoms[sym.id]}
                                onChange={() => toggleSymptom(sym.id)}
                                className="w-5 h-5 text-primary rounded focus:ring-purple-500"
                            />
                            <span className="font-medium text-darkText">{sym.label}</span>
                        </label>
                    ))}
                </div>

                <button
                    onClick={checkSymptoms}
                    disabled={Object.values(selectedSymptoms).every(v => !v)}
                    className="w-full bg-primary disabled:bg-softGray disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold hover:bg-primary transition-colors shadow-lg shadow-purple-200"
                >
                    Analyze Symptoms
                </button>
            </div>

            {result && (
                <div className={`mt-8 p-6 rounded-2xl border shadow-sm max-w-2xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-6 animate-in slide-in-from-bottom-4 duration-500
                    ${result.severity === 'high' ? 'bg-primary border-primary' :
                        result.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                            'bg-primary border-primary'}`}>

                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0
                        ${result.severity === 'high' ? 'bg-primary text-primary' :
                            result.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-primary text-primary'}`}>
                        {result.severity === 'high' ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h3 className={`font-bold text-xl mb-2
                            ${result.severity === 'high' ? 'text-primary' :
                                result.severity === 'medium' ? 'text-yellow-900' :
                                    'text-primary'}`}>{result.condition}</h3>

                        <p className="mb-6 text-darkText leading-relaxed">
                            {result.action === 'EMERGENCY' ? 'Potential medical emergency detected. Immediate professional attention is strongly recommended.' :
                                result.action === 'CONSULT' ? 'Your symptoms suggest a condition that requires medical diagnosis. Please book an appointment.' :
                                    'Symptoms appear mild. Rest, stay hydrated, and monitor your condition. Consult a doctor if symptoms persist.'}
                        </p>

                        {result.action === 'EMERGENCY' ? (
                            <button onClick={() => window.location.href = '/emergency'} className="w-full md:w-auto bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-primary transition-colors flex items-center justify-center gap-2">
                                Launch Emergency Response
                            </button>
                        ) : result.action === 'CONSULT' ? (
                            <button className="w-full md:w-auto bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-primary transition-colors">
                                Find a Doctor
                            </button>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SymptomChecker;
