const REQUIRED_CATEGORIES = ['Food', 'Medicine', 'Clothing', 'Other Amenities'];

function getPackageSuggestions(items) {
    const suggestions = [];
    const categoryCount = {};

    let totalWeight = 0;

    // Step 1: Category Coverage Check
    items.forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
        totalWeight += (item.weight || 0) * (item.quantity || 1);
    });

    REQUIRED_CATEGORIES.forEach(category => {
        if (!categoryCount[category]) {
            suggestions.push(`Add some ${category.toLowerCase()} to the package.`);
        }
    });

    // Step 2: Nutritional Deficiency Check (if 'Food' category is present)
    if (categoryCount['Food']) {
        let totalProtein = 0, totalCarbs = 0, totalCalcium = 0;

        items.filter(item => item.category === 'Food').forEach(foodItem => {
            totalProtein += (foodItem.nutrition.protein || 0) * (foodItem.quantity || 1);
            totalCarbs += (foodItem.nutrition.carbs || 0) * (foodItem.quantity || 1);
            totalCalcium += (foodItem.nutrition.calcium || 0) * (foodItem.quantity || 1);
        });

        if (totalProtein < 50) suggestions.push("Add more protein-rich food.");
        if (totalCarbs < 250) suggestions.push("Add more carb-rich food.");
        if (totalCalcium < 500) suggestions.push("Add calcium-rich food.");
    }

    // Step 3: Weight Optimization Check
    if (totalWeight > 10) {
        suggestions.push("Consider replacing heavier items with lighter alternatives to reduce package weight.");
    }

    // Step 4: Final Message
    if (suggestions.length === 0) {
        return ["No suggestion needed. The package is well-balanced."];
    }

    return suggestions;
}

module.exports = { getPackageSuggestions };