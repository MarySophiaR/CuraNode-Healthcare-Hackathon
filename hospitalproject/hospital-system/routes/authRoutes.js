const express = require('express');
const router = express.Router();
const { registerHospital, loginHospital, updateHospitalResources, getMe, completeDispatch, getHospitalStats, forceAssignQueue, updateHospitalProfile, changePassword, registerUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerHospital);
router.post('/register-user', registerUser);
router.post('/login', loginHospital);
router.get('/me', protect, getMe);
router.get('/stats', protect, authorize('hospital'), getHospitalStats);
router.patch('/profile', protect, updateHospitalProfile);
router.patch('/change-password', protect, changePassword);
router.patch('/update-resources', protect, authorize('hospital'), updateHospitalResources);
router.patch('/dispatch/:dispatchId/complete', protect, authorize('hospital'), completeDispatch);
router.post('/queue/:emergencyId/assign', protect, authorize('hospital'), forceAssignQueue);

module.exports = router;
