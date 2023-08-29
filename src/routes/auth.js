// Import base
const express = require("express");

// Import controller
const authController = require("../controllers/auth");

// Create router
const router = express.Router();

// Apply controller
router.post("/register", authController.postRegister);
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);

// Export router
module.exports = router;
