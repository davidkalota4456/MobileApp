const express = require('express');
const LiveMessage = require('../models/LiveMessage'); // Adjust the path if necessary
const router = express.Router();

// POST route to create a new live message
router.post('/create', async (req, res) => {
    const { gmail, message } = req.body;

    if (!gmail || !message) {
        return res.status(400).json({ message: 'Gmail and message are required' });
    }

    try {
        const newMessage = await LiveMessage.create({
            gmail,
            message,
        });
        res.status(201).json({ message: 'Message sent successfully', newMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET route to fetch all live messages
router.get('/all', async (req, res) => {
    try {
        const messages = await LiveMessage.findAll();
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/answer', async (req, res) => {
    const { gmail, message } = req.body;
    if (!gmail || !message) {
        return res.status(400).json({ message: 'Gmail and message are required' });
    }
    console.log('you live msg to clients >>>')
        res.status(201).json({ message: 'Message sent successfully' });
    });

module.exports = router;
