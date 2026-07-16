const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

// Admin sees full system data; doctor sees their own data only
router.get('/', protect, checkRole('admin', 'doctor'), getAnalytics);

module.exports = router;
