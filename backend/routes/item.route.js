const express = require("express");
const router = express.Router();
const { upload, uploadToS3 } = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');

const {
  getItems,
  getSingleItem,
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/item.controller");

// All item routes require authentication
router.get("/", authenticateToken, getItems);
router.get("/:id", authenticateToken, getSingleItem);
router.post("/", authenticateToken, upload.single('image'), uploadToS3, createItem);
router.put("/:id", authenticateToken, upload.single('image'), uploadToS3, updateItem);
router.delete("/:id", authenticateToken, deleteItem);

module.exports = router;