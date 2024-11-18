const express = require('express');
const { handleChatRequest } = require('../controllers/chatgpt/ChatbotController')
const router = express.Router();

router.post('/chatbot', handleChatRequest);

module.exports = router;
