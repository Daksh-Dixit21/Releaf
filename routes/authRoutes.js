const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const { name, email, phone, password, city, state, role, services, description, redirect } = req.body;

        let user = await User.findOne({ email });

        if (user) {
            const token = jwt.sign({ userId: user._id }, "yourSecretKey", { expiresIn: "7d" });
            res.cookie("token", token, { httpOnly: true });

            return res.redirect(redirect || "/dashboard");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            city,
            state,
            role,
            services,
            description,
        });

        await user.save();

        // Generate token and log the user in
        const token = jwt.sign({ userId: user._id }, "yourSecretKey", { expiresIn: "7d" });
        res.cookie("token", token, { httpOnly: true });

        res.redirect(redirect || "/dashboard");

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;