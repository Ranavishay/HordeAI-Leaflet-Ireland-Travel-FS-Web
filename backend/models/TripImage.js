const mongoose = require('mongoose');

const tripImageSchema = new mongoose.Schema({
    tripType: {
        type: String,
        required: true
    },
    image: {
        data: Buffer,
        contentType: String
    }
});

module.exports = mongoose.model('TripImage', tripImageSchema);
