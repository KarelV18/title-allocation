const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Allocation = require('../models/Allocation');
const User = require('../models/User');

const router = express.Router();

// Get allocations needing supervisor assignment
router.get('/needs-supervisor', auth, authorize('admin'), async (req, res) => {
    try {
        const allocations = await Allocation.getNeedsSupervisor();
        const supervisors = await User.getAllByRole('supervisor');
        
        // Calculate supervisor remaining capacity
        const supervisorAllocations = await Allocation.getAll();
        const supervisorCapacity = new Map();
        
        supervisors.forEach(supervisor => {
            const allocationsCount = supervisorAllocations.filter(a => 
                a.supervisorId && a.supervisorId.toString() === supervisor._id.toString()
            ).length;
            
            supervisorCapacity.set(supervisor._id.toString(), {
                supervisor: supervisor,
                current: allocationsCount,
                capacity: supervisor.capacity || 0,
                remaining: (supervisor.capacity || 0) - allocationsCount
            });
        });

        res.json({
            allocations,
            supervisors: Array.from(supervisorCapacity.values())
        });
    } catch (error) {
        console.error('Error fetching allocations needing supervisor:', error);
        res.status(500).json({ message: 'Error fetching data' });
    }
});

// Assign supervisor to allocation
router.post('/:allocationId/assign-supervisor', auth, authorize('admin'), async (req, res) => {
    try {
        const { allocationId } = req.params;
        const { supervisorId } = req.body;

        if (!supervisorId) {
            return res.status(400).json({ message: 'Supervisor ID is required' });
        }

        // Verify supervisor exists and has capacity
        const supervisor = await User.findById(supervisorId);
        if (!supervisor || supervisor.role !== 'supervisor') {
            return res.status(400).json({ message: 'Invalid supervisor' });
        }

        // Check supervisor capacity
        const supervisorAllocations = await Allocation.findBySupervisor(supervisorId);
        if (supervisorAllocations.length >= supervisor.capacity) {
            return res.status(400).json({ message: 'Supervisor has reached capacity' });
        }

        // Update allocation
        await Allocation.updateSupervisor(allocationId, supervisorId, supervisor.name);

        res.json({ 
            message: 'Supervisor assigned successfully',
            supervisorName: supervisor.name
        });
    } catch (error) {
        console.error('Error assigning supervisor:', error);
        res.status(500).json({ message: 'Error assigning supervisor' });
    }
});

// Auto-assign supervisors to all pending allocations
router.post('/auto-assign', auth, authorize('admin'), async (req, res) => {
    try {
        const allocations = await Allocation.getNeedsSupervisor();
        const supervisors = await User.getAllByRole('supervisor');
        
        let assignedCount = 0;
        const results = [];

        for (const allocation of allocations) {
            // Find supervisor with remaining capacity
            const availableSupervisor = supervisors.find(supervisor => {
                const allocationsCount = allocations.filter(a => 
                    a.supervisorId && a.supervisorId.toString() === supervisor._id.toString()
                ).length;
                return (supervisor.capacity || 0) > allocationsCount;
            });

            if (availableSupervisor) {
                await Allocation.updateSupervisor(
                    allocation._id, 
                    availableSupervisor._id, 
                    availableSupervisor.name
                );
                assignedCount++;
                results.push({
                    student: allocation.studentName,
                    title: allocation.title,
                    supervisor: availableSupervisor.name
                });
            }
        }

        res.json({
            message: `Auto-assignment completed: ${assignedCount}/${allocations.length} allocations assigned`,
            assignedCount,
            totalNeeding: allocations.length,
            results
        });
    } catch (error) {
        console.error('Error in auto-assignment:', error);
        res.status(500).json({ message: 'Error during auto-assignment' });
    }
});

module.exports = router;