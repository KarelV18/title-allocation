const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Allocation = require('../models/Allocation');
const User = require('../models/User');
const { SecondMarkerAssignment } = require('../controllers/secondMarkerController');
const XLSX = require('xlsx');

const router = express.Router();

router.get('/excel', auth, authorize('admin'), async (req, res) => {
    try {
        console.log('=== Starting Report Generation ===');
        console.log('User making request:', req.user.username, 'Role:', req.user.role);

        const allocations = await Allocation.getAll();
        const students = await User.getAllByRole('student');

        console.log('Allocations found:', allocations ? allocations.length : 0);

        if (!allocations || allocations.length === 0) {
            return res.status(400).json({
                message: 'No allocations found. Please run the allocation process first.'
            });
        }    // Get supervisor data for capacity reporting
        const supervisors = await User.getAllByRole('supervisor');

        // Create student email map
        const studentEmailMap = new Map();
        students.forEach(student => {
            studentEmailMap.set(student.username, student.email);
        });

        if (!allocations || allocations.length === 0) {
            return res.status(400).json({
                message: 'No allocations found. Please run the allocation process first.'
            });
        }

        const supervisorCapacity = new Map();

        // Calculate REAL-TIME supervisor allocations
        for (const supervisor of supervisors) {
            const supervisorAllocations = await Allocation.findBySupervisor(supervisor._id);
            const currentCount = supervisorAllocations ? supervisorAllocations.length : 0;
            supervisorCapacity.set(supervisor._id.toString(), {
                supervisorName: supervisor.name,
                current: currentCount,
                capacity: supervisor.capacity || 0
            });
        }

        // Prepare data for Sheet 1: Allocations
        // Prepare data for Excel
        const data = allocations.map(allocation => {
            const supervisorInfo = allocation.supervisorId ?
                supervisorCapacity.get(allocation.supervisorId.toString()) : null;

            return {
                'Student ID': allocation.studentUsername,
                'Student Name': allocation.studentName,
                'Supervisor Name': allocation.supervisorName || 'Not Assigned',
                'Supervisor Capacity': supervisorInfo ?
                    `${supervisorInfo.current}/${supervisorInfo.capacity}` : 'N/A',
                'Allocated Title': allocation.isCustomTitle ? allocation.title + '*' : allocation.title,
                'Custom Title': allocation.isCustomTitle ? 'Yes' : 'No',
                'Needs Supervisor': allocation.needsSupervisor ? 'Yes' : 'No',
                'Allocation Date': allocation.allocatedAt ?
                    new Date(allocation.allocatedAt).toLocaleDateString() : 'N/A'
            };
        });

        // Generate second marker assignments for Sheet 2
        const supervisedAllocations = allocations.filter(a => a.supervisorId);
        const assignmentEngine = new SecondMarkerAssignment(supervisedAllocations, supervisors);
        const secondMarkerResults = assignmentEngine.assignSecondMarkers();

        // Prepare data for Sheet 2: VIVA Plan
        const vivaPlanData = secondMarkerResults.assignments.map(assignment => {
            // Split student name into first and last name
            const nameParts = assignment.studentName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            return {
                'Student ID': assignment.studentUsername,
                'Student First Name': firstName,
                'Student Last Name': lastName,
                'Student Email': studentEmailMap.get(assignment.studentUsername) || 'N/A',
                'Allocated Title': assignment.title,
                'Supervisor': assignment.supervisorName,
                '2nd Marker': assignment.secondMarkerName
            };
        });

        // Add summary rows to allocation data
        allocationData.unshift({
            'Student ID': 'SUMMARY',
            'Student Name': `Total Allocations: ${allocations.length}`,
            'Supervisor Name': `Custom Titles: ${allocations.filter(a => a.isCustomTitle).length}`,
            'Supervisor Capacity': `Needs Supervisor: ${allocations.filter(a => a.needsSupervisor).length}`,
            'Allocated Title': `Regular Titles: ${allocations.filter(a => !a.isCustomTitle).length}`,
            'Custom Title': `Generated: ${new Date().toLocaleDateString()}`,
            'Needs Supervisor': '',
            'Allocation Date': ''
        });

        // Add supervisor capacity summary
        allocationData.unshift({
            'Student ID': 'SUPERVISOR CAPACITY',
            'Student Name': '=== SUPERVISOR CAPACITY SUMMARY ===',
            'Supervisor Name': '',
            'Supervisor Capacity': '',
            'Allocated Title': '',
            'Custom Title': '',
            'Needs Supervisor': '',
            'Allocation Date': ''
        });

        Array.from(supervisorCapacity.values()).forEach(cap => {
            allocationData.unshift({
                'Student ID': '',
                'Student Name': cap.supervisorName,
                'Supervisor Name': `${cap.current}/${cap.capacity}`,
                'Supervisor Capacity': cap.capacity > 0 ?
                    `${Math.round((cap.current / cap.capacity) * 100)}% utilized` : 'N/A',
                'Allocated Title': cap.current <= cap.capacity ? 'Within Capacity' : 'OVER CAPACITY',
                'Custom Title': '',
                'Needs Supervisor': '',
                'Allocation Date': ''
            });
        });

        // Add second marker statistics to VIVA Plan
        vivaPlanData.unshift({
            'Student ID': 'SECOND MARKER STATISTICS',
            'Student First Name': '=== SECOND MARKER ASSIGNMENT SUMMARY ===',
            'Student Last Name': '',
            'Student Email': '',
            'Allocated Title': '',
            'Supervisor': '',
            '2nd Marker': ''
        });

        secondMarkerResults.statistics.supervisorPairStats.forEach(stat => {
            vivaPlanData.unshift({
                'Student ID': '',
                'Student First Name': stat.supervisorName,
                'Student Last Name': `Supervises: ${stat.supervisionCount}, Marks: ${stat.secondMarkingCount}`,
                'Student Email': `Unique 2nd Markers: ${stat.uniquePairs}`,
                'Allocated Title': stat.pairs.join(', '),
                'Supervisor': '',
                '2nd Marker': ''
            });
        });

        // Create workbook with two sheets
        const wb = XLSX.utils.book_new();

        // Sheet 1: Allocations
        const ws1 = XLSX.utils.json_to_sheet(allocationData);
        const allocationColWidths = [
            { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 20 },
            { wch: 50 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
        ];
        ws1['!cols'] = allocationColWidths;
        XLSX.utils.book_append_sheet(wb, ws1, 'Allocations');

        // Sheet 2: VIVA Plan
        const ws2 = XLSX.utils.json_to_sheet(vivaPlanData);
        const vivaColWidths = [
            { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 25 },
            { wch: 50 }, { wch: 25 }, { wch: 25 }
        ];
        ws2['!cols'] = vivaColWidths;
        XLSX.utils.book_append_sheet(wb, ws2, 'VIVA Plan');

        // Generate buffer
        const buf = XLSX.write(wb, {
            type: 'buffer',
            bookType: 'xlsx'
        });

        // Set headers
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `title_allocations_with_viva_plan_${dateStr}.xlsx`;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Length', buf.length);

        console.log(`=== Report Generated Successfully: ${allocations.length} records, ${vivaPlanData.length} VIVA assignments ===`);
        res.send(buf);

    } catch (error) {
        console.error('=== Report Generation Error ===', error);
        res.status(500).json({
            message: 'Error generating report: ' + error.message
        });
    }
});


// Add a new endpoint to get allocation statistics
router.get('/statistics', auth, authorize('admin'), async (req, res) => {
    try {
        const allocations = await Allocation.getAll();
        const supervisors = await User.getAllByRole('supervisor');

        // Calculate real-time statistics
        const stats = {
            totalAllocations: allocations.length,
            customTitles: allocations.filter(a => a.isCustomTitle).length,
            needsSupervisor: allocations.filter(a => a.needsSupervisor).length,
            regularTitles: allocations.filter(a => !a.isCustomTitle).length,
            supervisorUtilization: []
        };

        // Calculate supervisor utilization
        for (const supervisor of supervisors) {
            const supervisorAllocations = await Allocation.findBySupervisor(supervisor._id);
            const currentCount = supervisorAllocations ? supervisorAllocations.length : 0;
            const capacity = supervisor.capacity || 0;

            stats.supervisorUtilization.push({
                supervisorName: supervisor.name,
                current: currentCount,
                capacity: capacity,
                remaining: capacity - currentCount,
                utilization: capacity > 0 ? (currentCount / capacity) * 100 : 0
            });
        }

        res.json(stats);
    } catch (error) {
        console.error('Error fetching allocation statistics:', error);
        res.status(500).json({ message: 'Error fetching statistics' });
    }
});

module.exports = router;