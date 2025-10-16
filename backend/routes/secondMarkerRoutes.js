const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { assignSecondMarkers, getSecondMarkerAssignments } = require('../controllers/secondMarkerController');

const router = express.Router();

router.post('/assign', auth, authorize('admin'), assignSecondMarkers);
router.get('/assignments', auth, authorize('admin'), getSecondMarkerAssignments);

module.exports = router;