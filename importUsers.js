const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const fs = require("fs");
const User = require("./models/User");

dotenv.config(); // Load environment variables

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Read JSON File
let users;
try {
  users = JSON.parse(fs.readFileSync("users.json", "utf-8"));
} catch (err) {
  console.error("❌ Error Reading JSON File:", err);
  process.exit(1);
}

// Function to Import Data
const importData = async () => {
  try {
    console.log("🔄 Importing Users...");

    for (let user of users) {
      const existingUser = await User.findOne({ phone: user.phone });
      
      if (existingUser) {
        console.log(`⚠️ Skipping duplicate: ${user.phone}`);
        continue; // Skip duplicate entries
      }

      // Hash the password before inserting
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);

      await User.create(user);
      console.log(`✅ Inserted: ${user.name}`);
    }

    console.log("🎉 Users Imported Successfully!");
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error Importing Users:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

importData();
