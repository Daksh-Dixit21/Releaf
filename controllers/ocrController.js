const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { marked } = require('marked');
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).render('upload', { 
                error: 'No file uploaded.', 
                extractedText: null, 
                cleanedText: null, 
                generatedResponse: null, 
                status: null 
            });
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));

        const pythonOCRAPI = 'http://localhost:8000/ocr/upload/';

        const response = await axios.post(pythonOCRAPI, formData, {
            headers: { ...formData.getHeaders() }
        });

        // Convert Markdown to HTML
        const generatedResponseHTML = marked(response.data.generated_response || '');

        res.render('upload', {
            error: null, 
            extractedText: response.data.extracted_text,
            cleanedText: response.data.cleaned_text,
            generatedResponse: generatedResponseHTML, // Send HTML version
            status: response.data.status
        });

    } catch (error) {
        console.error('OCR Error:', error);
        res.status(500).render('upload', {
            error: 'Failed to extract text from image.', 
            extractedText: null,
            cleanedText: null,
            generatedResponse: null,
            status: null
        });
    }
};