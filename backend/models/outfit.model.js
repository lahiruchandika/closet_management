const mongoose = require("mongoose");

const outfitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    occasion: {
      type: String,
    },
    createdDate: {
      type: Date,
      default: Date.now,
    },
    plannedDate: {
      type: Date,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Add index for better query performance
    },
    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        x: { type: Number, required: true }, // canvas x coordinate
        y: { type: Number, required: true }, // canvas y coordinate
        width: { type: Number }, // optional, in case user resizes item
        height: { type: Number }, // optional
        rotation: { type: Number }, // optional for canvas rotation
        zIndex: { type: Number }, // optional for stacking order
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add compound index for user-specific queries with sorting
outfitSchema.index({ user: 1, createdAt: -1 });

const Outfit = mongoose.model("Outfit", outfitSchema);
module.exports = Outfit;