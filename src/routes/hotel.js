// Import base
const express = require("express");

// Import controller
const hotelController = require("../controllers/hotel");

// Create router
const router = express.Router();

// Apply controller
router.get("/get-all", hotelController.getAllHotels);
router.get("/get-by-id", hotelController.getHotelById);
router.get("/count", hotelController.getHotelCount);
router.get("/top-rate", hotelController.getHotelTopRate);
router.post("/create", hotelController.postCreateHotel);
router.post("/update-by-id", hotelController.postUpdateHotelById);
router.post("/search", hotelController.postHotelSearch);
router.post("/search-free-rooms", hotelController.postFreeRoomsSearch);
router.post("/delete-by-id", hotelController.postDeleteHotelById);

// Export router
module.exports = router;
