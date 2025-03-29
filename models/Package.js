const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    items: [
        {
            category: { type: String, required: true }, // e.g., Clothing, Food
            name: { type: String, required: true },     // e.g., Gloves, Biscuits
            quantity: { type: Number, required: true },
            weight: { type: Number, required: true }, // Weight per item (grams)
            nutritionalValue: {
                protein: { type: Number, default: 0 },
                carbs: { type: Number, default: 0 },
                calcium: { type: Number, default: 0 }
            }
        }
    ],
    totalWeight: { type: Number, required: true },
    nutritionalSummary: {
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        calcium: { type: Number, default: 0 }
    },
    servings: { type: String, required: true }, // e.g., "2-4 servings"
    suggestions: { type: Array, default: ['No Suggestions'] },
    createdBy: { 
        type: Object, 
        required: true, 
        default: { name: "", email: "" }  // Default to empty object to avoid validation errors
    }
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);