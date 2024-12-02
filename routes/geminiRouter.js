const express = require('express');
const router = express.Router();
const geminiAPI = require('../models/gemini_api');

router.post('/start', async (req, res) => {
    try {
        const { jobTitle } = req.body;
        if (!jobTitle) {
            return res.status(400).json({ error: 'Job title is required' });
        }
        
        const result = await geminiAPI.startInterview(jobTitle);
        res.json(result);
    } catch (error) {
        console.error('Error starting interview:', error);
        res.status(500).json({ error: 'Failed to start interview' });
    }
});

router.post('/generate', async (req, res) => {
    try {
        const { prompt, jobTitle, questionCount } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        if (!jobTitle) {
            return res.status(400).json({ error: 'Job title is required' });
        }
        if (typeof questionCount !== 'number') {
            return res.status(400).json({ error: 'Question count is required' });
        }
        
        const result = await geminiAPI.generateResponse(prompt, jobTitle, questionCount);
        res.json(result);
    } catch (error) {
        console.error('Error in Gemini API:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

module.exports = router;
