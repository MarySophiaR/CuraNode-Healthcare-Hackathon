const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all appointments for the logged in hospital
// @route   GET /api/appointments
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const hospitalId = req.user._id; // Match protect middleware
        const appointments = await Appointment.find({ hospitalId }).sort({ createdAt: -1 });
        res.json(appointments);
    } catch (error) {
        console.error('Fetch Appointments Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update appointment status
router.patch('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findOne({ _id: req.params.id, hospitalId: req.user._id });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        appointment.status = status;
        await appointment.save();

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (User/Hospital)
router.post('/', protect, async (req, res) => {
    console.log('Received Appointment Request Body:', req.body);
    try {
        const {
            hospitalId,
            patientName,
            patientAge,
            category,
            patientEmail,
            patientPhone,
            appointmentDate,
            appointmentTime,
            serviceType,
            message
        } = req.body;

        const appointment = await Appointment.create({
            hospitalId,
            patientName,
            patientAge,
            category,
            patientEmail,
            patientPhone,
            appointmentDate,
            appointmentTime,
            serviceType,
            message
        });

        // Get IO instance
        const io = req.app.get('io');
        if (io) {
            io.to(hospitalId.toString()).emit('newAppointment', {
                appointment,
                message: `New appointment from ${patientName}`
            });
        }

        res.status(201).json(appointment);
    } catch (error) {
        console.error('Create Appointment Error:', error);
        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
});

module.exports = router;
