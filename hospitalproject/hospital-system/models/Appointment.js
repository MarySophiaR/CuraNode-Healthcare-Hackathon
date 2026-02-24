const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    patientName: {
        type: String,
        required: [true, 'Please add patient name']
    },
    patientAge: {
        type: String,
        required: [true, 'Please add patient age']
    },
    category: {
        type: String,
        enum: ['Normal', 'Elderly', 'Pregnancy'],
        default: 'Normal'
    },
    patientEmail: {
        type: String
    },
    patientPhone: {
        type: String
    },
    appointmentDate: {
        type: String // Optional for simplified booking
    },
    appointmentTime: {
        type: String // Optional for simplified booking
    },
    serviceType: {
        type: String,
        enum: ['General Consultation', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Radiology', 'Other'],
        default: 'General Consultation'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    message: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
