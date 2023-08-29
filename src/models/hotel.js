// Import base
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// Create schema
const hotelSchema = Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  distance: {
    type: Number,
    required: true,
  },
  photos: [{ type: String, required: true }],
  desc: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  cheapestPrice: {
    type: Number,
    require: true,
  },
  title: {
    type: String,
    require: true,
  },
  featured: {
    type: Boolean,
    required: true,
  },
  rooms: [
    {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
  ],
});

// Create user model and export
module.exports = mongoose.model("Hotel", hotelSchema);
