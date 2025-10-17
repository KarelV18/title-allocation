const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Input validation
    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ message: 'Invalid credentials format' });
    }

    const user = await User.findByUsername(username);
    if (!user) {
      // Use generic error message to prevent user enumeration
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Ensure JWT secret is set
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        username: user.username
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'title-allocation-system',
        audience: 'title-allocation-users'
      }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);

    // Generic error message in production
    const message = process.env.NODE_ENV === 'production'
      ? 'Authentication failed'
      : error.message;

    res.status(500).json({ message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Validate new password strength
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters long'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await User.comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    await User.updatePassword(userId, newPassword);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error.message);

    const message = process.env.NODE_ENV === 'production'
      ? 'Password change failed'
      : error.message;

    res.status(500).json({ message });
  }
};

module.exports = { login, changePassword };