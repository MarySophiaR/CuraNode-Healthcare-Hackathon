const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const hospitalSchema = new mongoose.Schema({
    hospitalName: {
        type: String,
        required: [true, 'Please add a hospital name']
    },
    role: {
        type: String,
        enum: ['hospital'],
        default: 'hospital'
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    location: {
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
    // --- UPDATED RESOURCE SECTION (CLEAN VERSION) ---
    totalBeds: { type: Number, default: 100 },
    availableBeds: { type: Number, default: 0 },

    icuBeds: { type: Number, default: 50 },
    availableICU: { type: Number, default: 0 },

    oxygenUnits: { type: Number, default: 50 },
    availableOxygen: { type: Number, default: 0 },

    ambulancesTotal: { type: Number, default: 10 },
    ambulancesAvailable: { type: Number, default: 0 },
    // --- END UPDATED SECTION ---
    bloodAvailable: {
        type: Boolean,
        default: false
    },
    avgWaitTime: {
        type: Number,
        default: 0
    },
    hospitalStatus: {
        type: String,
        enum: ['online', 'offline'],
        default: 'online'
    },
    heroImage: {
        type: String,
        default: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2070&auto=format&fit=crop'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    dispatches: [{
        emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyRequest' },
        severity: { type: String },
        dispatchedAt: { type: Date, default: Date.now },
        estimatedReturnTime: { type: Date },
        status: { type: String, enum: ['dispatched', 'completed'], default: 'dispatched' }
    }],
    waitingQueue: [{
        emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyRequest' },
        severity: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            required: true
        },
        joinedAt: { type: Date, default: Date.now },
        requirements: {
            icu: Boolean,
            bed: Boolean,
            ambulance: Boolean,
            oxygen: Boolean
        }
    }]
});

// Encrypt password using bcrypt
hospitalSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
hospitalSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Hospital', hospitalSchema);