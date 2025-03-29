const express = require("express");
const PDFDocument = require("pdfkit");
const moment = require("moment");
const mongoose = require('mongoose');
const Item = require("../models/Item");
const { getPackageSuggestions } = require('../utils/packageSuggestions'); 
const Package = require("../models/Package"); 

const router = express.Router();
function calculateServingsByCategory(packageItems) {
    const categoryGroups = {};
    packageItems.forEach(item => {
        if (!categoryGroups[item.category]) {
            categoryGroups[item.category] = [];
        }
        categoryGroups[item.category].push(item);
    });

    const categoryAverages = {};
    for (const category in categoryGroups) {
        const items = categoryGroups[category];
        let totalServings = 0;
        items.forEach(item => {
            totalServings += item.servingSize * item.quantity;
        });
        categoryAverages[category] = totalServings / items.length;
    }
    return categoryAverages;
}
function calculateRealisticServings(packageItems) {
    const categoryAverages = calculateServingsByCategory(packageItems);
    const categoryCount = Object.keys(categoryAverages).length;

    if (categoryCount === 0) return 0;

    if (categoryCount === 1) {
        return Math.ceil(categoryAverages[Object.keys(categoryAverages)[0]]);
    }

    if (categoryCount > 1) {
        const sortedAverages = Object.entries(categoryAverages).sort(([, a], [, b]) => b - a);
        const highestCategory = sortedAverages[0][0];
        const remainingAverages = Object.entries(categoryAverages)
            .filter(([category]) => category !== highestCategory)
            .map(([, average]) => Math.ceil(average));

        if (remainingAverages.length === 0) return 0;

        const sumRemaining = remainingAverages.reduce((acc, val) => acc + val, 0);
        const averageRemaining = sumRemaining / remainingAverages.length;

        const maxServings = 30;
        const minServings = 3;
        return Math.ceil(Math.min(maxServings, Math.max(minServings, averageRemaining)));
    }
    return 0;
}

router.get("/package", async (req, res) => {
    try {
        const items = await Item.find();
        res.render("package", { items, packageDetails: null });
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).send("Server Error");
    }
});

router.post("/package", async (req, res) => {
    try {
        const { name, items, createdBy } = req.body;

        if (!name) return res.status(400).json({ error: "Package name is required." });
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "No items selected." });
        }
        if (!createdBy || !createdBy.name || !createdBy.email) {
            return res.status(400).json({ error: "CreatedBy details are missing." });
        }

        const itemIds = items.map(item => new mongoose.Types.ObjectId(item.id));
        const availableItems = await Item.find({ _id: { $in: itemIds } });

        let totalWeight = 0;
        const nutritionalSummary = { protein: 0, calcium: 0, carbs: 0 };

        const packageItems = items.map(item => {
            const foundItem = availableItems.find(dataItem => dataItem._id.toString() === item.id);
            if (!foundItem) throw new Error(`Item '${item.name}' not found.`);

            totalWeight += foundItem.weight * item.quantity;
            nutritionalSummary.protein += (foundItem.nutrition.protein || 0) * item.quantity;
            nutritionalSummary.calcium += (foundItem.nutrition.calcium || 0) * item.quantity;
            nutritionalSummary.carbs += (foundItem.nutrition.carbs || 0) * item.quantity;

            return { ...foundItem.toObject(), quantity: item.quantity };
        });
        const totalServings = calculateRealisticServings(packageItems);
        const suggestions = getPackageSuggestions(packageItems, nutritionalSummary, totalWeight);
        const newPackage = new Package({
            name,
            items: packageItems,
            totalWeight,
            nutritionalSummary,
            servings: totalServings,
            suggestions,
            createdBy: { name: createdBy.name, email: createdBy.email }
        });

        const savedPackage = await newPackage.save();
        res.status(201).json({
            message: "Package created successfully",
            packageDetails: newPackage.items || [],
            _id: savedPackage._id
        });
    } catch (error) {
        console.error("Error processing package:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/package/report/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const packageData = await Package.findById(id)
            .populate('createdBy')
            .populate('items');

        if (!packageData) {
            return res.status(404).json({ error: "Package not found" });
        }

        const doc = new PDFDocument({
            margin: 50,
            margins: { top: 70, bottom: 50, left: 50, right: 50 },
            font: "Helvetica",
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${packageData.name}_Report.pdf`);

        doc.pipe(res);

        doc.lineWidth(2).moveTo(50, 70).lineTo(580, 70).stroke();

        doc.fontSize(20).font("Helvetica-Bold").text("RELEAF LINK", 50, 95);

        doc.image("reportlogo.png", 480, 7, { width: 100, align: "center" });

        doc.lineWidth(1).moveTo(50, 130).lineTo(580, 130).stroke();

        doc.fontSize(16).text(`Report: ${packageData.name}`, 50, 160);

        const currentDate = moment().format("MMMM Do YYYY, h:mm:ss a");
        doc.fontSize(12).text(`Created: ${currentDate}`, 320, 140, { align: "right" });
        doc.fontSize(12).text(`Created By: ${packageData.createdBy?.name || "Unknown"}`, 320, 160, { align: "right" });
        doc.fontSize(12).text(`Email: ${packageData.createdBy?.email || "Unknown"}`, 320, 180, { align: "right" });

        doc.lineWidth(1).moveTo(50, 200).lineTo(580, 200).stroke();

        doc.fontSize(18).font("Helvetica-Bold").text("Package Items:", 50, 220).moveDown(1);

        doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .rect(50, doc.y, 530, 20)
            .fill("#333")
            .fillColor("#fff")
            .text("Item Name", 55, doc.y + 5)
            .text("Quantity", 470, doc.y - 15, { align: "right" })
            .moveDown(1);

        doc.moveTo(50, doc.y).lineTo(580, doc.y).stroke().moveDown(1);

        packageData.items.forEach((item, index) => {
            if (index % 2 === 0) {
                doc.rect(50, doc.y - 5, 530, 20).fill("#f0f0f0");
            }
            doc
                .fillColor("#000")
                .text(`${item.name}`, 55, doc.y)
                .text(`${item.quantity} units`, 470, doc.y - 15, { align: "right" })
                .moveDown(1);
        });

        const boxX = 150;
        const boxY = doc.y + 20;
        const boxWidth = 300;
        const boxHeight = 150;
        doc.lineWidth(2).rect(boxX, boxY, boxWidth, boxHeight).stroke();

        // Total Items, Weights, and Nutritional Value
        doc.fontSize(14).text(`Total Items: ${packageData.items.length}`, boxX + 10, boxY + 10);
        doc.fontSize(14).text(`Total Weight: ${packageData.totalWeight} kg`, boxX + 10, boxY + 30);
        doc.fontSize(14).text(`Serving Size: ${packageData.servings}`, boxX + 10, boxY + 50);
        doc.fontSize(14).text(`Nutritional Summary:`, boxX + 10, boxY + 70);
        doc.fontSize(14).text(`Protein: ${packageData.nutritionalSummary.protein}`, boxX + 30, boxY + 90);
        doc.fontSize(14).text(`Carbohydrates: ${packageData.nutritionalSummary.carbs}`, boxX + 30, boxY + 110);
        doc.fontSize(14).text(`Calcium: ${packageData.nutritionalSummary.calcium}`, boxX + 30, boxY + 130).moveDown(1);

        doc.moveTo(50, doc.y + 10).lineTo(580, doc.y + 10).stroke().moveDown(1);

        doc.fontSize(16).font("Helvetica-Bold").text("AI Generated Suggestions:", 50, doc.y).moveDown(1);
        doc.fontSize(12).font("Helvetica");

        if (Array.isArray(packageData.suggestions)) {
            packageData.suggestions.forEach((suggestion, idx) => {
                doc.text(`${idx + 1}. ${suggestion}`).moveDown(0.5);
            });
        } else if (typeof packageData.suggestions === "string") {
            doc.text(packageData.suggestions).moveDown(1);
        } else {
            doc.text("No suggestions available.").moveDown(1);
        }

        doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .text("Generated By ", 50, doc.y + 10)
            .fillColor("green")
            .text("Re-Leaf Link: Disaster Management Platform", { continued: true })
            .fillColor("black")
            .moveDown(1);

        doc.end();
    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ error: "Error generating report" });
    }
});

module.exports = router;
