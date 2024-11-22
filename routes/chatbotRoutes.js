const express = require('express');
const { handleChatRequest } = require('../controllers/chatgpt/chatbotController')
const router = express.Router();

router.post('/chatbot', handleChatRequest);

module.exports = router;
