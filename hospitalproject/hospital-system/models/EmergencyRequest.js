const mongoose = require('mongoose');

const emergencyRequestSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    userLocation: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true,
            index: '2dsphere'
        }
    },
    severity: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    requiresICU: { type: Boolean, default: false },
    requiresBed: { type: Boolean, default: false },
    requiresAmbulance: { type: Boolean, default: false },
    requiresOxygen: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'arrived'],
        default: 'pending'
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('EmergencyRequest', emergencyRequestSchema);
