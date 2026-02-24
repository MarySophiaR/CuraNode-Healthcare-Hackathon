const { updateHospitalResources } = require('./controllers/authController');

// Mock request and response
const req = {
    hospital: { _id: '507f1f77bcf86cd799439011' },
    body: { availableBeds: 10 },
    app: { get: () => ({}) } // Mock io
};

const res = {
    status: (code) => ({
        json: (data) => console.log(`Status: ${code}, Data:`, data)
    }),
    json: (data) => console.log('Success Data:', data)
};

// Mock console.error to avoid clutter but capture the error
const originalConsoleError = console.error;
console.error = (msg, err) => {
    if (err && err.name === 'ReferenceError' && err.message === 'mongoose is not defined') {
        console.log('SUCCESS: Reproduce ReferenceError: mongoose is not defined');
    } else {
        originalConsoleError(msg, err);
    }
};

// Run the controller
(async () => {
    try {
        await updateHospitalResources(req, res);
    } catch (e) {
        console.log('Caught Error:', e);
    }
})();
