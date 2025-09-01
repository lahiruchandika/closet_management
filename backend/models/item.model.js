const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter item name"],
      trim: true,
    },
    color: {
      type: String,
      required: false,
      trim: true,
    },
    usageCount: {
        type: Number,
        default: 0,
    },
    dressCode: {
      type: String,
      required: false,
      trim: true,
    },
    brand: {
      type: String,
      required: false,
      trim: true,
    },
    material: {
      type: String,
      required: false,
      trim: true,
    },
    itemType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemType", // References the ItemType model
      required: false,
      index: true,
    },
    image: {
      type: String,
      required: false,
    },
    backgroundRemoved: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // References the User model
      required: [true, "User is required"],
      index: true, // Add index for better query performance
    },
  },
  {
    timestamps: true,
  }
);

itemSchema.index({ user: 1, createdAt: -1 });

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;
