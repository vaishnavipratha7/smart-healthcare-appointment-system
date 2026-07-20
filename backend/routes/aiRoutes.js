const express = require('express');
const router = express.Router();
const {
  recommendSpecialization,
  checkAIHealth,
} = require('../controllers/aiController');

/**
 * AI-Powered Appointment Assistant Routes
 * 
 * These routes integrate with the Python ML service for symptom analysis
 * and specialization recommendation.
 */

// Public routes
router.post('/recommend-specialization', recommendSpecialization);
router.get('/health', checkAIHealth);

module.exports = router;
