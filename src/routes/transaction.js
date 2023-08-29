// Import base
const express = require("express");

// Import controller
const tranController = require("../controllers/transaction");

// Create router
const router = express.Router();

// Apply controller
router.post("/create-transaction", tranController.postCreateTransaction);
router.get("/get-by-user-id/:userId", tranController.getTransactionsByUserId);
router.get("/get-latest", tranController.getLatestTransactions);
router.get("/count", tranController.getTransactionsCount);
router.get("/earnings", tranController.getEarnings);

// Export router
module.exports = router;
