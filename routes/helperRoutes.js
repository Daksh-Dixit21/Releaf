const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const users = await User.find(); // Fetch all users from MongoDB
        res.render("helper", { title: "Helper List", users }); // Render helper.ejs with user data
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
