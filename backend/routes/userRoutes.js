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
          for (const row of results) {
            // Default password if not provided
            const password = row.password || 'default123';
            const user = await User.create({
              username: row.username,
              password: password,
              role: row.role,
              name: row.name,
              email: row.email
            });
            users.push(user);
          }
          
          // Clean up uploaded file
          fs.unlinkSync(req.file.path);
          
          res.json({ 
            message: 'Users created successfully', 
            count: users.length,
            users: users.map(u => ({ username: u.username, role: u.role, name: u.name }))
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