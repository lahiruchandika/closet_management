const express = require("express");
const router = express.Router();

const {
    createItemType,
    getItemTypes,
    getSingleItemTypeById,
    getTypeWithItems
} = require("../controllers/itemType.controller");

router.post("/", createItemType);
router.get("/", getItemTypes);
router.get("/:id", getSingleItemTypeById);
router.get("/:id/items", getTypeWithItems);

module.exports = router;