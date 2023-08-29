// Import base
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// Create schema
const userSchema = Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    required: true,
  },
});

// Create model and export
module.exports = mongoose.model("User", userSchema);
