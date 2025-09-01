const Outfit = require("../models/outfit.model");
const Item = require("../models/item.model");

// GET all outfits for the authenticated user
const getOutfits = async (req, res) => {
  try {
    const userId = req.user.id; // From authenticateToken middleware
    const outfits = await Outfit.find({ user: userId })
      .populate("items.item") // populate item details
      .sort({ createdAt: -1 });

    res.status(200).json(outfits);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET single outfit by ID for the authenticated user
const getSingleOutfit = async (req, res) => {
  try {
    const userId = req.user.id;
    const outfitId = req.params.id;

    const outfit = await Outfit.findOne({
      _id: outfitId,
      user: userId,
    }).populate("items.item");

    if (!outfit) {
      return res.status(404).json({
        message: "Outfit not found or you don't have permission to access it",
      });
    }

    res.status(200).json(outfit);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

// CREATE new outfit for the authenticated user
const createOutfit = async (req, res) => {
  try {
    const userId = req.user.id; // From authenticateToken middleware
    const { name, occasion, plannedDate, items } = req.body;

    if (!name || !occasion || !items || items.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create outfit with authenticated user ID
    const outfit = await Outfit.create({
      name,
      occasion,
      plannedDate,
      user: userId, // Use authenticated user's ID
      items, // expects array of { item, x, y, width, height, rotation, zIndex }
    });

    // Increment usageCount by 1 for each unique item used in the outfit
    if (items && items.length > 0) {
      const itemIds = items
        .map((it) => it.item)
        .filter(Boolean)
        .map(String);
      const uniqueItemIds = [...new Set(itemIds)];

      // Build a list of update operations that increment usageCount by 1
      const usageIncrement = uniqueItemIds.map((id) => ({
        updateOne: {
          filter: { _id: id, user: userId }, // Also ensure items belong to the user
          update: { $inc: { usageCount: 1 } },
        },
      }));

      if (usageIncrement.length > 0) {
        await Item.bulkWrite(usageIncrement);
      }
    }

    res.status(201).json(outfit);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

// DELETE outfit (only if it belongs to the authenticated user)
const deleteOutfit = async (req, res) => {
  try {
    const userId = req.user.id;
    const outfitId = req.params.id;

    const outfit = await Outfit.findOneAndDelete({
      _id: outfitId,
      user: userId,
    });

    if (!outfit) {
      return res.status(404).json({
        message: "Outfit not found or you don't have permission to delete it",
      });
    }

    res.status(200).json({ message: "Outfit deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOutfits,
  getSingleOutfit,
  createOutfit,
  deleteOutfit,
};
