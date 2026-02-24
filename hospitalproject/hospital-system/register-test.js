const axios = require('axios');

const API_URL = 'http://localhost:5000/api/hospital';

const registerFixedHospital = async () => {
    try {
        await axios.post(`${API_URL}/register`, {
            hospitalName: 'General Hospital',
            email: 'admin@hospital.com',
            password: 'password123',
            location: { type: 'Point', coordinates: [77.6, 12.9] },
            totalBeds: 50,
            availableBeds: 20,
            ambulancesAvailable: 3
        });
        console.log('Hospital Registered: admin@hospital.com / password123');
    } catch (error) {
        if (error.response?.data?.message === 'Hospital already exists') {
            console.log('Hospital already exists, ready to login.');
        } else {
            console.error('Registration failed:', error.message);
        }
    }
};

registerFixedHospital();
