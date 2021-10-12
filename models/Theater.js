const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TheaterSchema = new Schema({
  location: {
    address: {
      street1: String,
      city: String,
      state: String,
      zipcode: Number,
    },
    geo: {
      type: {
        type: String,
        required: true,
      },
      coordinates: { type: [Number], required: true },
    },
  },
});

module.exports = mongoose.model('theaters', TheaterSchema);
