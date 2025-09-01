const express = require("express");
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const {
  getOutfits,
  getSingleOutfit,
  createOutfit,
  deleteOutfit,
} = require("../controllers/outfit.controller");

// All outfit routes require authentication
router.get("/", authenticateToken, getOutfits);
router.get("/:id", authenticateToken, getSingleOutfit);
router.post("/", authenticateToken, createOutfit);
router.delete("/:id", authenticateToken, deleteOutfit);

module.exports = router;