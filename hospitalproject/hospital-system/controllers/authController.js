const Hospital = require('../models/Hospital');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new hospital
// @route   POST /api/hospital/register
// @access  Public
const registerHospital = async (req, res) => {
    const {
        hospitalName,
        email,
        password,
        location,
        totalBeds,
        availableBeds,
        icuBeds,
        availableICU,
        oxygenUnits,
        availableOxygen,
        bloodAvailable,
        avgWaitTime,
        ambulancesTotal,
        ambulancesAvailable,
        hospitalStatus
    } = req.body;

    try {
        const hospitalExists = await Hospital.findOne({ email });

        if (hospitalExists) {
            return res.status(400).json({ message: 'Hospital already exists' });
        }

        const hospital = await Hospital.create({
            hospitalName,
            email,
            password,
            location,
            // Ensure registration starts with healthy defaults if not provided
            totalBeds: totalBeds || 100,
            availableBeds: availableBeds || 0,
            icuBeds: icuBeds || 50,
            availableICU: availableICU || 0,
            oxygenUnits: oxygenUnits || 50,
            availableOxygen: availableOxygen || 0,
            bloodAvailable: bloodAvailable || false,
            avgWaitTime: avgWaitTime || 0,
            ambulancesTotal: ambulancesTotal || 10,
            ambulancesAvailable: ambulancesAvailable || 0,
            hospitalStatus: hospitalStatus || 'online'
        });

        if (hospital) {
            res.status(201).json({
                _id: hospital._id,
                hospitalName: hospital.hospitalName,
                email: hospital.email,
                role: 'hospital',
                token: generateToken(hospital._id, 'hospital'),
            });
        } else {
            res.status(400).json({ message: 'Invalid hospital data' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Authenticate a hospital
// @route   POST /api/hospital/login
// @access  Public
const loginHospital = async (req, res) => {
    const { email, password } = req.body;

    try {
        const hospital = await Hospital.findOne({ email }).select('+password');

        if (hospital && (await hospital.matchPassword(password))) {
            const hospitalData = hospital.toObject();
            delete hospitalData.password;

            res.json({
                ...hospitalData,
                token: generateToken(hospital._id, 'hospital'),
            });
        } else {
            // Check User collection
            const User = require('../models/User');
            const user = await User.findOne({ email }).select('+password');
            if (user && (await user.matchPassword(password))) {
                const userData = user.toObject();
                delete userData.password;
                res.json({
                    ...userData,
                    token: generateToken(user._id, 'user'),
                });
            } else {
                res.status(401).json({ message: 'Invalid email or password' });
            }
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update hospital resources
// @route   PATCH /api/hospital/update-resources
// @access  Private
const updateHospitalResources = async (req, res) => {
    try {
        const hospitalId = req.user._id;

        // 1. Prepare data and force Number types
        const updates = { ...req.body };
        const numericFields = ['availableBeds', 'totalBeds', 'icuBeds', 'availableICU', 'oxygenUnits', 'availableOxygen', 'ambulancesTotal', 'ambulancesAvailable'];

        numericFields.forEach(field => {
            if (updates[field] !== undefined) updates[field] = Number(updates[field]);
        });

        // 2. THE LOCK BREAKER: Direct Atomic Update
        // This bypasses ALL Mongoose schema validation and middleware
        const updatedHospital = await Hospital.findOneAndUpdate(
            { _id: hospitalId },
            { $set: { ...updates, updatedAt: new Date() } },
            { new: true, runValidators: false }
        );

        if (!updatedHospital) return res.status(404).json({ message: 'Hospital not found' });

        // 3. Socket and Queue Logic
        const io = req.app.get('io');

        // Explicitly emit update with STRING ID to ensure comparison works in frontend
        io.emit('hospitalUpdate', {
            hospitalId: hospitalId.toString(),
            ...updates
        });

        const { processQueue } = require('../services/emergencyService');
        await processQueue(hospitalId, io);

        res.json(updatedHospital);
    } catch (error) {
        console.error("CRITICAL UPDATE ERROR:", error);
        res.status(500).json({ message: "Database rejected the atomic update" });
    }
};

// @desc    Mark dispatch as completed
const completeDispatch = async (req, res) => {
    try {
        const { dispatchId } = req.params;
        const io = req.app.get('io');

        const { markDispatchCompleted } = require('../services/emergencyService');
        const hospital = await markDispatchCompleted(req.user._id, dispatchId, io);

        res.json(hospital);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get hospital statistics
const getHospitalStats = async (req, res) => {
    try {
        const EmergencyRequest = require('../models/EmergencyRequest');
        const hospitalId = req.user._id;
        const hospital = await Hospital.findById(hospitalId);

        const totalEmergencies = await EmergencyRequest.countDocuments({ hospitalId });
        const accepted = await EmergencyRequest.countDocuments({ hospitalId, status: { $in: ['accepted', 'arrived'] } });
        const rejected = await EmergencyRequest.countDocuments({ hospitalId, status: 'rejected' });
        const criticalCount = await EmergencyRequest.countDocuments({ hospitalId, severity: { $gte: 4 } });

        let totalResponseTimeMs = 0;
        let responseCount = 0;

        const populatedHospital = await Hospital.findById(hospitalId).populate('dispatches.emergencyId');

        populatedHospital.dispatches.forEach(dispatch => {
            if (dispatch.emergencyId && dispatch.dispatchedAt) {
                const created = new Date(dispatch.emergencyId.createdAt);
                const dispatched = new Date(dispatch.dispatchedAt);
                const diff = dispatched - created;
                if (diff > 0) {
                    totalResponseTimeMs += diff;
                    responseCount++;
                }
            }
        });

        const averageResponseTime = responseCount > 0
            ? Math.round((totalResponseTimeMs / responseCount) / 1000 / 60)
            : 0;

        const severityStats = await EmergencyRequest.aggregate([
            { $match: { hospitalId: hospitalId } },
            { $group: { _id: "$severity", count: { $sum: 1 } } }
        ]);

        const severityBreakdown = { low: 0, medium: 0, high: 0, critical: 0 };
        severityStats.forEach(stat => {
            if (stat._id === 1 || stat._id === 2) severityBreakdown.low += stat.count;
            if (stat._id === 3) severityBreakdown.medium += stat.count;
            if (stat._id === 4) severityBreakdown.high += stat.count;
            if (stat._id === 5) severityBreakdown.critical += stat.count;
        });

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const timelineStats = await EmergencyRequest.aggregate([
            { $match: { hospitalId: hospitalId, createdAt: { $gte: twentyFourHoursAgo } } },
            { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]);

        const emergencyTimeline = timelineStats.map(stat => ({
            time: `${stat._id}:00`,
            count: stat.count
        }));

        const ambulanceUtilizationPercent = hospital.ambulancesTotal > 0
            ? Math.round(((hospital.ambulancesTotal - hospital.ambulancesAvailable) / hospital.ambulancesTotal) * 100)
            : 0;

        res.json({
            totalEmergencies,
            accepted,
            rejected,
            criticalCount,
            averageResponseTime,
            severityBreakdown,
            emergencyTimeline,
            ambulanceUtilizationPercent
        });

    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get current user/hospital profile
// @route   GET /api/hospital/me
// @access  Private
const getMe = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Force assign emergency to queue (Placeholder)
// @route   POST /api/hospital/queue/:emergencyId/assign
// @access  Private
const forceAssignQueue = async (req, res) => {
    // Placeholder to prevent crash. 
    // Real implementation would interact with emergencyService
    res.status(200).json({ message: 'Force assign not implemented yet' });
};

// @desc    Update hospital profile (name, hero image, etc)
// @route   PATCH /api/hospital/profile
// @access  Private
const updateHospitalProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const hospitalId = req.user._id;
        const { hospitalName, heroImage, email } = req.body;

        const updates = {};
        if (hospitalName) updates.hospitalName = hospitalName;
        if (heroImage) updates.heroImage = heroImage;
        if (email) updates.email = email;

        const updatedHospital = await Hospital.findOneAndUpdate(
            { _id: hospitalId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedHospital) return res.status(404).json({ message: 'Hospital not found' });

        // 3. Socket Notification
        const io = req.app.get('io');
        io.emit('hospitalUpdate', {
            hospitalId: hospitalId.toString(),
            ...updates
        });

        res.json(updatedHospital);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Change password
// @route   PATCH /api/hospital/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new password' });
        }

        const Model = req.role === 'hospital' ? Hospital : require('../models/User');
        const user = await Model.findById(req.user._id).select('+password');

        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ message: 'Invalid current password' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Register new user
// @route   POST /api/hospital/register-user
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const User = require('../models/User');
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = await User.create({ name, email, password });
        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: 'user',
                token: generateToken(user._id, 'user'),
            });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    registerHospital,
    loginHospital,
    updateHospitalResources,
    completeDispatch,
    getHospitalStats,
    getMe,
    forceAssignQueue,
    updateHospitalProfile,
    changePassword,
    registerUser
};