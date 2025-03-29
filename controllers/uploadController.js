exports.processImage = (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
  
    res.json({ success: "File uploaded successfully", file: req.file.filename });
  };
  