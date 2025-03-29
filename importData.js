const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Item = require("./models/Item");
const fs = require("fs");

dotenv.config(); // Load .env variables

mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB Connection Error:", err));

const importData = async () => {
    try {
        // Read JSON file
        const data = JSON.parse(fs.readFileSync("data.json", "utf-8"));

        // Insert into MongoDB
        await Item.insertMany(data);
        console.log("Data Imported Successfully!");
        process.exit(); // Exit script
    } catch (error) {
        console.error("Error Importing Data:", error);
        process.exit(1); // Exit with error
    }
};

importData();
