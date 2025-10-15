const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Allocation = require('../models/Allocation');
const XLSX = require('xlsx');

const router = express.Router();

router.get('/excel', auth, authorize('admin'), async (req, res) => {
    try {
        console.log('=== Starting Report Generation ===');
        console.log('User making request:', req.user.username, 'Role:', req.user.role);

        const allocations = await Allocation.getAll();
        console.log('Allocations found:', allocations ? allocations.length : 0);

        if (!allocations || allocations.length === 0) {
            return res.status(400).json({ 
                message: 'No allocations found. Please run the allocation process first.' 
            });
        }

        // Prepare data for Excel
        const data = allocations.map(allocation => ({
            'Student ID': allocation.studentUsername,
            'Student Name': allocation.studentName,
            'Supervisor Name': allocation.supervisorName,
            'Allocated Title': allocation.isCustomTitle ? allocation.title + '*' : allocation.title,
            'Custom Title': allocation.isCustomTitle ? 'Yes' : 'No'
        }));

        // Add summary row
        data.unshift({
            'Student ID': 'SUMMARY',
            'Student Name': `Total Allocations: ${allocations.length}`,
            'Supervisor Name': `Custom Titles: ${allocations.filter(a => a.isCustomTitle).length}`,
            'Allocated Title': `Regular Titles: ${allocations.filter(a => !a.isCustomTitle).length}`,
            'Custom Title': `Generated: ${new Date().toLocaleDateString()}`
        });

        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Set column widths
        const colWidths = [
            { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 50 }, { wch: 12 }
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Title Allocations');

        // Generate buffer
        const buf = XLSX.write(wb, { 
            type: 'buffer', 
            bookType: 'xlsx'
        });

        // Set headers - FIX: Proper filename without extra characters
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `title_allocations_${dateStr}.xlsx`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Length', buf.length);

        console.log(`=== Report Generated Successfully: ${allocations.length} records ===`);
        res.send(buf);

    } catch (error) {
        console.error('=== Report Generation Error ===', error);
        res.status(500).json({ 
            message: 'Error generating report: ' + error.message 
        });
    }
});

module.exports = router;