const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const SystemSettings = require('../models/SystemSettings');

const router = express.Router();

// Get system settings
router.get('/', auth, async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error fetching system settings:', error);
        res.status(500).json({ message: 'Error fetching system settings' });
    }
});

// Update preference deadline (Admin only)
router.post('/preference-deadline', auth, authorize('admin'), async (req, res) => {
    try {
        const { deadline } = req.body;
        await SystemSettings.updatePreferenceDeadline(deadline);
        res.json({ message: 'Preference deadline updated successfully' });
    } catch (error) {
        console.error('Error updating preference deadline:', error);
        res.status(500).json({ message: 'Error updating preference deadline' });
    }
});

// Set allocation completed status (Admin only)
router.post('/allocation-completed', auth, authorize('admin'), async (req, res) => {
    try {
        const { completed } = req.body;
        await SystemSettings.setAllocationCompleted(completed);
        res.json({ message: `Allocation status set to ${completed ? 'completed' : 'not completed'}` });
    } catch (error) {
        console.error('Error updating allocation status:', error);
        res.status(500).json({ message: 'Error updating allocation status' });
    }
});

// Check if student can edit preferences
router.get('/can-edit-preferences', auth, async (req, res) => {
    try {
        const canEdit = await SystemSettings.isBeforeDeadline();
        const allocationCompleted = await SystemSettings.isAllocationCompleted();
        
        res.json({ 
            canEdit, 
            allocationCompleted,
            message: canEdit ? 
                'You can edit your preferences' : 
                'The deadline for editing preferences has passed'
        });
    } catch (error) {
        console.error('Error checking edit permissions:', error);
        res.status(500).json({ message: 'Error checking permissions' });
    }
});

module.exports = router;