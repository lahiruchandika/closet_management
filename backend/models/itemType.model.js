const mongoose = require("mongoose");

const itemTypeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

itemTypeSchema.virtual("items", {
  ref: "Item",            
  localField: "_id",       
  foreignField: "itemType",
});

const ItemType = mongoose.model("ItemType", itemTypeSchema);
module.exports = ItemType;
