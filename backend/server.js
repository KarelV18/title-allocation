const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const titleRoutes = require('./routes/titleRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const customTitleRoutes = require('./routes/customTitleRoutes');
const supervisorAssignmentRoutes = require('./routes/supervisorAssignmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const systemSettingsRoutes = require('./routes/systemSettingsRoutes');
const capacityConflictRoutes = require('./routes/capacityConflictRoutes');


const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/titles', titleRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/custom-titles', customTitleRoutes);
app.use('/api/supervisor-assignment', supervisorAssignmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/system-settings', systemSettingsRoutes);
app.use('/api/capacity-conflicts', capacityConflictRoutes);


// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Database connection and server start
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});