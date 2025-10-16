const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Preference = require('../models/Preference');
const Allocation = require('../models/Allocation');
const User = require('../models/User');
const { ObjectId } = require('mongodb');

const router = express.Router();

// Get all capacity conflicts
router.get('/conflicts', auth, authorize('admin'), async (req, res) => {
    try {
        const preferences = await Preference.getAll();
        const students = await User.getAllByRole('student');
        const supervisors = await User.getAllByRole('supervisor');
        const allocations = await Allocation.getAll();

        // Calculate current supervisor allocations
        const supervisorAllocations = new Map();
        allocations.forEach(allocation => {
            if (allocation.supervisorId) {
                const supervisorId = allocation.supervisorId.toString();
                supervisorAllocations.set(supervisorId, 
                    (supervisorAllocations.get(supervisorId) || 0) + 1
                );
            }
        });

        const conflicts = [];

        // Find approved custom titles that exceed capacity
        for (const pref of preferences) {
            if (pref.customTitle && pref.customTitle.status === 'approved') {
                const student = students.find(s => s._id.toString() === pref.studentId.toString());
                let supervisor;

                if (pref.customTitle.approvedSupervisorId) {
                    supervisor = await User.findById(pref.customTitle.approvedSupervisorId);
                } else {
                    supervisor = await User.findByUsername(pref.customTitle.supervisorUsername) ||
                        supervisors.find(s => s.name === pref.customTitle.supervisorName);
                }

                if (supervisor && student) {
                    const supervisorId = supervisor._id.toString();
                    const currentAllocations = supervisorAllocations.get(supervisorId) || 0;
                    const supervisorCapacity = supervisor.capacity || 0;

                    if (currentAllocations >= supervisorCapacity) {
                        conflicts.push({
                            studentId: pref.studentId,
                            studentName: student.name,
                            studentUsername: student.username,
                            customTitle: pref.customTitle.title,
                            preferredSupervisorId: supervisor._id,
                            preferredSupervisorName: supervisor.name,
                            supervisorCapacity: supervisorCapacity,
                            supervisorCurrent: currentAllocations,
                            conflictType: 'CAPACITY_EXCEEDED',
                            preferenceData: pref
                        });
                    }
                }
            }
        }

        res.json(conflicts);
    } catch (error) {
        console.error('Error fetching capacity conflicts:', error);
        res.status(500).json({ message: 'Error fetching capacity conflicts' });
    }
});

// Resolve capacity conflict
router.post('/resolve', auth, authorize('admin'), async (req, res) => {
    try {
        const { studentId, action, newSupervisorId, rejectReason } = req.body;

        if (!studentId || !action) {
            return res.status(400).json({ message: 'Student ID and action are required' });
        }

        const preference = await Preference.findByStudent(studentId);
        if (!preference || !preference.customTitle) {
            return res.status(404).json({ message: 'Student preference or custom title not found' });
        }

        if (action === 'reassign') {
            if (!newSupervisorId) {
                return res.status(400).json({ message: 'New supervisor ID is required for reassignment' });
            }

            const newSupervisor = await User.findById(newSupervisorId);
            if (!newSupervisor || newSupervisor.role !== 'supervisor') {
                return res.status(400).json({ message: 'Invalid supervisor' });
            }

            // Check if new supervisor has capacity
            const currentAllocations = await Allocation.findBySupervisor(newSupervisorId);
            const currentCount = currentAllocations ? currentAllocations.length : 0;
            const supervisorCapacity = newSupervisor.capacity || 0;

            if (currentCount >= supervisorCapacity) {
                return res.status(400).json({ 
                    message: `New supervisor ${newSupervisor.name} also has no capacity (${currentCount}/${supervisorCapacity})` 
                });
            }

            // Reassign to new supervisor
            await Preference.updateCustomTitleStatus(studentId, 'approved', newSupervisorId);

            res.json({ 
                message: `Custom title reassigned to ${newSupervisor.name}`,
                supervisorName: newSupervisor.name
            });

        } else if (action === 'reject') {
            // Reject the custom title
            await Preference.updateCustomTitleStatus(studentId, 'rejected', null, rejectReason || 'Capacity constraints');

            res.json({ 
                message: 'Custom title rejected due to capacity constraints',
                studentWillUseRegularPreferences: true
            });
        } else {
            return res.status(400).json({ message: 'Invalid action. Use "reassign" or "reject".' });
        }
    } catch (error) {
        console.error('Error resolving capacity conflict:', error);
        res.status(500).json({ message: 'Error resolving capacity conflict' });
    }
});

module.exports = router;