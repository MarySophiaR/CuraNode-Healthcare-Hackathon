const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const http = require('http');
const Hospital = require('./models/Hospital');
const authRoutes = require('./routes/authRoutes');
const { protect } = require('./middleware/authMiddleware'); // For protected routes

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.json());

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

app.use('/uploads', express.static('uploads'));

// Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    res.json({ filename: req.file.filename, path: req.file.path });
});

// List Files Endpoint
app.get('/api/health-records', (req, res) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    fs.readdir(dir, (err, files) => {
        if (err) return res.status(500).json([]);
        const fileList = files.map(file => ({
            name: file,
            url: `http://localhost:5000/uploads/${file}`,
            date: fs.statSync(path.join(dir, file)).mtime
        }));
        res.json(fileList);
    });
});

// Routes
app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/curanode')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Route to populate hospitals (Seed Data)
app.get('/api/seed-hospitals', async (req, res) => {
    try {
        await Hospital.deleteMany({}); // Clear existing
        // Generate 10 dummy hospitals around a central point (e.g., user's likely city center, or just spread out)
        const baseLat = 40.7128;
        const baseLng = -74.0060;

        const hospitals = [];
        for (let i = 0; i < 10; i++) {
            hospitals.push({
                name: `City Hospital ${i + 1}`,
                lat: baseLat + (Math.random() * 0.1 - 0.05),
                lng: baseLng + (Math.random() * 0.1 - 0.05),
                availableBeds: Math.floor(Math.random() * 50),
                ambulancesAvailable: Math.floor(Math.random() * 5),
            });
        }

        await Hospital.insertMany(hospitals);
        res.json({ message: '10 Dummy Hospitals seeded successfully', count: hospitals.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const axios = require('axios');

// Helper: Haversine Formula for Distance (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Helper: Generate Simulated Hospitals near User (Fallback)
const generateSimulatedHospitals = (userLat, userLng, radiusKm = 50, count = 20) => {
    const hospitals = [];
    for (let i = 0; i < count; i++) {
        // Random offset within radius (approx 1 deg lat ~ 111km)
        const offsetLat = (Math.random() - 0.5) * (radiusKm / 111) * 2;
        const offsetLng = (Math.random() - 0.5) * (radiusKm / (111 * Math.cos(userLat * (Math.PI / 180)))) * 2;

        hospitals.push({
            name: `City Hospital ${String.fromCharCode(65 + i)}`,
            lat: userLat + offsetLat,
            lng: userLng + offsetLng,
            availableBeds: Math.floor(Math.random() * 45) + 5, // 5-50 beds
            ambulancesAvailable: Math.floor(Math.random() * 3),
            rating: (3 + Math.random() * 2).toFixed(1),
            id: `hospital-${i}-${Date.now()}` // Unique ID
        });
    }
    return hospitals;
};

// POST /api/rank-hospitals
app.post('/api/rank-hospitals', async (req, res) => {
    try {
        const { userLat, userLng, severity } = req.body;

        if (!userLat || !userLng || !severity) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        let hospitals = [];
        let searchRadius = 50000; // 50km in meters for API

        // 1. Try Fetching from Google Places API
        if (process.env.GOOGLE_MAPS_API_KEY) {
            try {
                const response = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json`, {
                    params: {
                        location: `${userLat},${userLng}`,
                        radius: searchRadius,
                        type: 'hospital',
                        keyword: 'hospital',
                        key: process.env.GOOGLE_MAPS_API_KEY
                    }
                });

                if (response.data.results.length > 0) {
                    hospitals = response.data.results.map(place => ({
                        name: place.name,
                        lat: place.geometry.location.lat,
                        lng: place.geometry.location.lng,
                        availableBeds: Math.floor(Math.random() * 45) + 5, // Simulated
                        ambulancesAvailable: Math.floor(Math.random() * 3),
                        place_id: place.place_id,
                        id: place.place_id // Use place_id as unique ID
                    }));
                }
            } catch (apiError) {
                console.error("Google API failed, falling back to simulation:", apiError.message);
            }
        }

        // 2. Fallback if no hospitals found or API failed
        if (hospitals.length === 0) {
            console.log("Using simulated hospitals");
            hospitals = generateSimulatedHospitals(userLat, userLng, 50, 20);
        }

        // 3. Score & Rank Logic
        let rankedHospitals = hospitals.map(hospital => {
            const distance = calculateDistance(userLat, userLng, hospital.lat, hospital.lng);
            return { ...hospital, distance };
        });

        // Filter by 50km Radius
        rankedHospitals = rankedHospitals.filter(h => h.distance <= 50);

        // Auto-Expand Logic: If < 1 result, expand to 80km (simulated for fallback)
        if (rankedHospitals.length === 0) {
            console.log("No hospitals in 50km, expanding to 80km...");
            const expandedHospitals = generateSimulatedHospitals(userLat, userLng, 80, 20);
            rankedHospitals = expandedHospitals.map(hospital => {
                const distance = calculateDistance(userLat, userLng, hospital.lat, hospital.lng);
                return { ...hospital, distance };
            }).filter(h => h.distance <= 80);
        }

        // Limit to Top 20 closest before scoring to keep it clean, as requested
        rankedHospitals.sort((a, b) => a.distance - b.distance);
        rankedHospitals = rankedHospitals.slice(0, 20);

        // Apply Scoring Formula
        rankedHospitals = rankedHospitals.map(hospital => {
            const { distance, availableBeds } = hospital;

            // ETA: Distance / 50kmph * 60 minutes
            const etaMinutes = (distance / 50) * 60;

            // Dynamic Weights
            let wDist = 0.4, wBeds = 0.4, wSev = 0.2;

            if (severity >= 8) {
                wDist = 0.3;     // Reduce distance weight slightly
                wBeds = 0.4;     // Keep beds importance
                wSev = 0.3;      // Increase severity weight
            }

            const bedFactor = availableBeds > 0 ? (1 / availableBeds) : 1;
            const score = (distance * wDist) + (bedFactor * wBeds) + (severity * wSev);

            return {
                ...hospital,
                distance: distance.toFixed(2), // km
                score: score.toFixed(4),
                eta: Math.round(etaMinutes) + ' mins'
            };
        });

        // Final Sort by Lowest Score
        rankedHospitals.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));

        res.json(rankedHospitals);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Queue Booking Endpoint (Mock)
app.post('/api/book-queue', protect, async (req, res) => {
    // Generate random queue number and wait time
    const { hospitalId } = req.body;
    const queueNumber = Math.floor(Math.random() * 50) + 1;
    const waitTime = Math.floor(Math.random() * 60) + 5;

    res.json({
        success: true,
        queueNumber: `Q-${queueNumber}`,
        estimatedWait: `${waitTime} mins`,
        hospitalId
    });
});

// Socket.io for Ambulance Alerts
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('request_ambulance', (data) => {
        console.log('Ambulance requested:', data);

        // Fix: Clear existing interval to prevent multiple dispatches
        if (socket.ambulanceInterval) {
            clearInterval(socket.ambulanceInterval);
        }

        // Simulate dispatch delay and updates
        setTimeout(() => {
            socket.emit('ambulance_status', {
                status: 'dispatched',
                eta: '10 mins',
                trackingId: 'AMB-123',
                driver: {
                    name: 'Rajesh Kumar',
                    vehicleNo: 'KA-01-EQ-2024',
                    contact: '+91 98765 43210',
                    rating: '4.8'
                }
            });
        }, 2000);

        // Simulate location updates (moving marker)
        let progress = 0;

        // Use Actual Hospital Location as Start Point (based on formula/selection)
        // Fallback to offset if not provided (legacy support)
        const startLat = data.hospitalLat || (data.userLat - 0.01);
        const startLng = data.hospitalLng || (data.userLng - 0.01);
        const endLat = data.userLat;
        const endLng = data.userLng;

        socket.ambulanceInterval = setInterval(() => {
            progress += 2; // Smoother animation (50 steps)

            const currentLat = startLat + ((endLat - startLat) * (progress / 100));
            const currentLng = startLng + ((endLng - startLng) * (progress / 100));

            socket.emit('ambulance_location_update', { lat: currentLat, lng: currentLng });

            if (progress >= 100) {
                clearInterval(socket.ambulanceInterval);
                socket.ambulanceInterval = null;
                socket.emit('ambulance_status', { status: 'arrived' });
            }
        }, 500); // Update every 500ms
    });

    socket.on('cancel_ambulance', () => {
        console.log('Ambulance cancelled by client');
        if (socket.ambulanceInterval) {
            clearInterval(socket.ambulanceInterval);
            socket.ambulanceInterval = null;
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        if (socket.ambulanceInterval) clearInterval(socket.ambulanceInterval);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
