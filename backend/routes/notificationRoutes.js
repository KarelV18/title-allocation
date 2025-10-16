const express = require('express');
const { auth } = require('../middleware/auth');
const Allocation = require('../models/Allocation');

const router = express.Router();

// Get unread notifications for student
router.get('/unread', auth, async (req, res) => {
    try {
        const notifications = await Allocation.getUnreadNotifications(req.user._id);
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
});

// Mark notification as read
router.post('/:allocationId/mark-read', auth, async (req, res) => {
    try {
        const { allocationId } = req.params;
        await Allocation.markAsNotified(allocationId);
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Error marking notification as read' });
    }
});

// Mark all notifications as read
router.post('/mark-all-read', auth, async (req, res) => {
    try {
        const unreadAllocations = await Allocation.getUnreadNotifications(req.user._id);
        
        for (const allocation of unreadAllocations) {
            await Allocation.markAsNotified(allocation._id);
        }
        
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Error marking notifications as read' });
    }
});

module.exports = router;