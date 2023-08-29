// Import base
const express = require("express");

// Import controller
const roomController = require("../controllers/room");

// Create router
const router = express.Router();

// Apply controller
router.get("/get-all", roomController.getAllRooms);
router.get("/get-by-id", roomController.getRoomById);
router.get("/get-non-attached", roomController.getNonAttachedRooms);
router.post("/delete-by-id", roomController.postDeleteRoomById);
router.post("/create", roomController.postCreateRoom);
router.post("/update-by-id", roomController.postUpdateRoomById);

// Export router
module.exports = router;
