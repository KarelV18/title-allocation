const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { ObjectId } = require('mongodb');
const csv = require('csv-parser');
const multer = require('multer');
const fs = require('fs');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get all users (Admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.collection().find().toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get all supervisors (Available for students and admin)
router.get('/supervisors', auth, async (req, res) => {
  try {
    const supervisors = await User.getAllByRole('supervisor');
    res.json(supervisors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching supervisors' });
  }
});

// Bulk upload users from CSV (Admin only)
// Update CSV upload to validate capacity
router.post('/bulk-upload', auth, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const users = [];
          let totalStudentCount = 0;
          let totalSupervisorCapacity = 0;

          // First pass: count students and supervisor capacity
          for (const row of results) {
            if (row.role === 'student') totalStudentCount++;
            if (row.role === 'supervisor') {
              const capacity = parseInt(row.capacity) || 0;
              totalSupervisorCapacity += capacity;
            }
          }

          // Validate capacity constraint
          if (totalSupervisorCapacity !== totalStudentCount) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
              message: `Capacity validation failed: Supervisor capacity (${totalSupervisorCapacity}) does not match student count (${totalStudentCount}). Please adjust capacities.`
            });
          }

          // Second pass: create users
          for (const row of results) {
            const password = row.password || 'default123';
            const user = await User.create({
              username: row.username,
              password: password,
              role: row.role,
              name: row.name,
              email: row.email,
              capacity: row.capacity ? parseInt(row.capacity) : 0 // Add capacity
            });
            users.push(user);
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            message: 'Users created successfully',
            count: users.length,
            totalStudentCount,
            totalSupervisorCapacity,
            users: users.map(u => ({
              username: u.username,
              role: u.role,
              name: u.name,
              capacity: u.capacity
            }))
          });
        } catch (error) {
          fs.unlinkSync(req.file.path);
          res.status(400).json({ message: 'Error processing CSV: ' + error.message });
        }
      });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

// Create single user (Admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { username, password, role, name, email } = req.body;
    const user = await User.create({ username, password, role, name, email });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: 'Error creating user' });
  }
});

module.exports = router;