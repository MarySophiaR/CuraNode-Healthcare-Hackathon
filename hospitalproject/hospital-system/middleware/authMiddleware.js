const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospital');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check both collections based on role in token if available, 
            // otherwise try finding in Hospital then User
            let user = await Hospital.findById(decoded.id).select('-password');
            if (user) {
                req.user = user;
                req.role = 'hospital';
            } else {
                user = await User.findById(decoded.id).select('-password');
                if (user) {
                    req.user = user;
                    req.role = 'user';
                }
            }

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            return res.status(401).json({ message: 'Not authorized' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.role)) {
            return res.status(403).json({
                message: `Role ${req.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
