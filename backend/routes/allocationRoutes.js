const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { runAllocation, getAllocations, getAllocationStats, publishAllocations, unpublishAllocations } = require('../controllers/allocationController');

const router = express.Router();

router.post('/run', auth, authorize('admin'), runAllocation);
router.get('/', auth, getAllocations);
router.get('/stats', auth, authorize('admin'), getAllocationStats);
router.post('/publish', auth, authorize('admin'), publishAllocations);
router.post('/unpublish', auth, authorize('admin'), unpublishAllocations);

module.exports = router;