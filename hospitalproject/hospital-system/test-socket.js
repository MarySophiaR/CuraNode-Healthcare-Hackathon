const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/hospital';
const SOCKET_URL = 'http://localhost:5000';

const runTest = async () => {
    // 1. Create a dummy hospital to get an ID
    let hospitalId;
    let token;
    try {
        const uniqueEmail = `hosp${Date.now()}@test.com`;
        const res = await axios.post(`${API_URL}/register`, {
            hospitalName: 'Socket Test Hospital',
            email: uniqueEmail,
            password: 'password123',
            location: { type: 'Point', coordinates: [0, 0] },
            ambulancesAvailable: 5,
            availableBeds: 10
        });
        hospitalId = res.data._id;
        token = res.data.token;
        console.log('Hospital Registered:', hospitalId);
    } catch (err) {
        console.error('Registration failed/exists, trying login or skipping if generic error', err.message);
        return;
    }

    // 2. Connect Hospital Socket
    const hospitalSocket = io(SOCKET_URL);

    hospitalSocket.on('connect', () => {
        console.log('Hospital Socket Connected');
        hospitalSocket.emit('registerHospital', hospitalId);
    });

    hospitalSocket.on('emergencyRequest', (data) => {
        console.log('Hospital received emergency request:', data);

        // Simulate acceptance
        setTimeout(() => {
            console.log('Hospital accepting emergency...');
            hospitalSocket.emit('acceptEmergency', {
                hospitalId: hospitalId,
                emergencyId: data.emergencyId
            });
        }, 1000);
    });

    // 3. Connect User Socket
    const userSocket = io(SOCKET_URL);

    userSocket.on('connect', () => {
        console.log('User Socket Connected');

        // Simulate sending emergency request
        setTimeout(() => {
            console.log('User sending emergency request...');
            userSocket.emit('emergencyRequest', {
                userId: 'user123',
                userLocation: { type: 'Point', coordinates: [0, 0] },
                severity: 3,
                selectedHospitalId: hospitalId,
                ETA: '10 mins'
            });
        }, 500);
    });

    userSocket.on('ambulanceDispatched', (data) => {
        console.log('User received ambulance dispatch:', data);
    });

    userSocket.on('hospitalUpdate', (data) => {
        console.log('User received hospital update:', data);
        // Verify resource decrement
        if (data.ambulancesAvailable < 5) {
            console.log('SUCCESS: Ambulances decremented');
        } else {
            console.log('FAIL: Ambulances not decremented');
        }

        // Cleanup
        setTimeout(() => {
            hospitalSocket.disconnect();
            userSocket.disconnect();
            process.exit(0);
        }, 1000);
    });

    userSocket.on('error', (err) => {
        console.error('User Socket Error:', err);
    });
};

runTest();
