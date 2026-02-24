const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    availableBeds: { type: Number, required: true },
    ambulancesAvailable: { type: Number, default: 0 },
});

module.exports = mongoose.model('Hospital', hospitalSchema);
