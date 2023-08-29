// Import base
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// Create schema
const roomSchema = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    maxPeople: {
      type: Number,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    roomNumbers: [
      {
        type: Number,
        required: true,
      },
    ],
  },
  { timestamps: true }
);

// Create model and export
module.exports = mongoose.model("Room", roomSchema);
