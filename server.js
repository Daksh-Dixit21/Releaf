const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");
const sosRoutes = require("./routes/sosRoutes");
const inventoryRoutes = require('./routes/inventoryRoutes');
const blogRoutes = require("./routes/blogRoutes");
const ocrRoutes = require("./routes/ocrRoutes");
const helperRoutes = require("./routes/helperRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/sos", sosRoutes);
app.use("/", inventoryRoutes); 
app.use("/blogs", blogRoutes);
app.use("/ocr", ocrRoutes);
app.use("/helper", helperRoutes); 
app.get("/", (req, res) => {
  res.render("index", { title: "Disaster Management" });
});

app.get("/blogs", (req, res) => {
  res.render("blogs", { title: "Blog Page" });
});

app.get("/ocr", (req, res) => {
  res.render("upload", { title: "Upload Page" });
});

app.get("/sos", (req, res)=>{
    res.render("sos", {title: "Send SOS"});
})

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB Connection Error:", err));