const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/ocrController');
const upload = require('../utils/uploadMiddleware');

router.get('/', (req, res) => {
    res.render('upload', { 
        error: null, 
        extractedText: null, 
        cleanedText: null, 
        generatedResponse: null, 
        status: null 
    }); 
});

router.post('/upload', upload.single('image'), uploadImage);

module.exports = router;