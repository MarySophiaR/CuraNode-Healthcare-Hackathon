const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.set('io', io);

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));

// Fallback for double /api (if frontend didn't refresh)
app.use('/api/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/api/auth', require('./routes/authRoutes'));

app.get('/', (req, res) => {
    res.send('CuraNode Backend is running');
});

const { createEmergency, acceptEmergency, rejectEmergency, autoCompleteDispatches } = require('./services/emergencyService');

// Background job: Check for expired dispatches every 60 seconds
setInterval(() => {
    autoCompleteDispatches(io).catch(err => console.error('Background Job Error:', err));
}, 60000);

// Store connected hospitals: hospitalId -> socketId
const connectedHospitals = new Map();

// Socket.io authentication middleware
const jwt = require('jsonwebtoken');
io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Authentication error: Invalid token'));
        socket.decoded = decoded; // { id, role }
        next();
    });
});

// Store connected clients: userId/hospitalId -> socketId (for direct emits if needed)
const connectedClients = new Map();

// Socket.io connection
io.on('connection', (socket) => {
    const { id, role } = socket.decoded;
    console.log(`New client connected: ${socket.id} (Role: ${role}, ID: ${id})`);

    // Secure Room Isolation
    socket.join(id);
    connectedClients.set(id, socket.id);

    socket.on('emergencyRequest', async (data) => {
        try {
            console.log(`[DISPATCH] Incoming request from User: ${id} for Hospital: ${data.selectedHospitalId}`);
            // Only users can request ambulances
            if (role !== 'user') throw new Error('Unauthorized role');

            // data: userLocation, severity, selectedHospitalId, requiresICU, etc.
            const emergency = await createEmergency({ ...data, userId: id });

            // Emit to selected hospital room
            const payload = {
                emergencyId: emergency._id,
                ...data,
                userId: id,
                timestamp: new Date()
            };

            // Original event for compatibility
            io.to(data.selectedHospitalId).emit('emergencyRequest', payload);

            // NEW EVENT for Alert UI
            io.to(data.selectedHospitalId).emit('new_emergency', payload);

            console.log(`[DISPATCH] Alert emitted to Hospital: ${data.selectedHospitalId} (EmergencyID: ${emergency._id})`);
        } catch (error) {
            console.error('Emergency Request Error:', error);
            socket.emit('error', { message: error.message });
        }
    });

    socket.on('acceptEmergency', async (data) => {
        try {
            // Only hospitals can accept
            if (role !== 'hospital') throw new Error('Unauthorized role');

            // data: emergencyId
            const { emergency, hospital } = await acceptEmergency(id, data.emergencyId, io);

            // Notify user directly in their private room
            io.to(emergency.userId).emit('ambulanceDispatched', {
                emergencyId: emergency._id,
                hospitalId: id,
                ambulanceId: 'AMB-' + Date.now()
            });

            // Update hospital public resource stats
            io.emit('hospitalUpdate', {
                hospitalId: id,
                availableBeds: hospital.availableBeds,
                availableICU: hospital.availableICU,
                availableOxygen: hospital.availableOxygen,
                ambulancesAvailable: hospital.ambulancesAvailable,
                activeDispatches: hospital.activeDispatches
            });

            // START SIMULATION: Emit only to the specific user's room
            let progress = 0;
            const interval = setInterval(() => {
                progress += 5;
                if (progress > 100) {
                    clearInterval(interval);
                    // Notify user
                    io.to(emergency.userId).emit('ambulanceStatus', { status: 'arrived', emergencyId: emergency._id });
                    // Notify hospital
                    io.to(id).emit('ambulanceStatus', { status: 'arrived', emergencyId: emergency._id });
                    return;
                }

                const update = {
                    emergencyId: emergency._id,
                    hospitalId: id,
                    progress: progress,
                    coords: {
                        lat: 12.9716 + (Math.random() - 0.5) * 0.01,
                        lng: 77.5946 + (Math.random() - 0.5) * 0.01
                    }
                };

                // Broadcast to user
                io.to(emergency.userId).emit('ambulanceLocationUpdate', update);
                // Broadcast to hospital
                io.to(id).emit('ambulanceLocationUpdate', update);
            }, 3000);

        } catch (error) {
            console.error('Accept Emergency Error:', error);
            socket.emit('error', { message: error.message });
        }
    });

    socket.on('rejectEmergency', async (data) => {
        try {
            if (role !== 'hospital') throw new Error('Unauthorized role');
            const emergency = await rejectEmergency(data.emergencyId);
            io.to(emergency.userId).emit('emergencyRejected', {
                emergencyId: emergency._id,
                message: 'Hospital rejected the request'
            });
        } catch (error) {
            console.error('Reject Emergency Error:', error);
        }
    });

    socket.on('ambulanceLocationManual', (data) => {
        // Only hospital can emit manual location updates
        if (role !== 'hospital') return;
        io.to(data.userId).emit('ambulanceLocationUpdate', data);
    });

    socket.on('newAppointment', (data) => {
        if (role !== 'user') return;
        // Emit to hospital room
        io.to(data.hospitalId).emit('newAppointment', { ...data, userId: id });
    });

    socket.on('disconnect', () => {
        connectedClients.delete(id);
        console.log(`Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
