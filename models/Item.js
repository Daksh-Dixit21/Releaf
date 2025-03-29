const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    weight: { type: Number, required: true },
    nutrition: {
        protein: { type: Number, default: 0 },
        calcium: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 }
    },
    servingSize: { type: Number, required: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], required: true }
});

const Item = mongoose.model("Item", itemSchema);
module.exports = Item;