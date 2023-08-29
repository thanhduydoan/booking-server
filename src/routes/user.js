// Import base
const express = require("express");

// Import controller
const userController = require("../controllers/user");

// Create router
const router = express.Router();

// Apply controller
router.get("/get-all", userController.getAllUsers);
router.get("/count", userController.getUsersCount);

// Export router
module.exports = router;
