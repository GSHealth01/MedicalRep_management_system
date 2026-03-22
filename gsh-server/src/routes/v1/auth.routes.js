const express = require('express');
const { prisma } = require('../../../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('../../config/env');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();

// Sign Up
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;

  // NEW Prisma query
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({ msg: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // NEW Prisma create
  const newUser = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
      name: name,
      designation: email === 'admin@gsh.com' ? 'ADMIN' : null
    }
  });

  // Create JWT (use newUser.id, not newUser._id)
  const payload = { sub: newUser.id, email: newUser.email, role: newUser.designation };
  const accessToken = jwt.sign(payload, config.JWT_ACCESS_SECRET, { expiresIn: config.ACCESS_TTL });
  const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: config.REFRESH_TTL });

  res.status(201).json({
    accessToken,
    refreshToken,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      designation: newUser.designation
    }
  });
});

// Sign In
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  // NEW Prisma query
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return res.status(400).json({ msg: 'Invalid email or password. Please check your credentials and try again.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ msg: 'Invalid email or password. Please check your credentials and try again.' });
  }

  // Check if user has required fields for non-admin users
  if (user.designation !== 'ADMIN') {
    if (!user.sector_id) {
      return res.status(400).json({ msg: 'User account is incomplete. Please contact administrator.' });
    }
  }

  // Create JWT (use user.id, not user._id)
  const payload = { sub: user.id, email: user.email, role: user.designation };
  const accessToken = jwt.sign(payload, config.JWT_ACCESS_SECRET, { expiresIn: config.ACCESS_TTL });
  const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: config.REFRESH_TTL });

  res.status(200).json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      designation: user.designation
    }
  });
});

// Refresh Token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ msg: 'Refresh token required' });
  }

  try {
    const payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    const newPayload = { sub: payload.sub, email: payload.email, role: payload.role };
    const newAccessToken = jwt.sign(newPayload, config.JWT_ACCESS_SECRET, { expiresIn: config.ACCESS_TTL });
    const newRefreshToken = jwt.sign(newPayload, config.JWT_REFRESH_SECRET, { expiresIn: config.REFRESH_TTL });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: { id: payload.sub, email: payload.email, role: payload.role }
    });
  } catch (error) {
    return res.status(401).json({ msg: 'Invalid refresh token' });
  }
});

// Step 1: Check if email exists
router.post('/forgot-password/check-email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ msg: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ msg: 'Email not found' });
    }

    res.status(200).json({ msg: 'Email verified' });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
});

// Step 2: Verify employee number for the given email
router.post('/forgot-password/verify-employee', async (req, res) => {
  const { email, empNo } = req.body;
  if (!email || !empNo) {
    return res.status(400).json({ msg: 'Email and Employee Number are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ msg: 'Email not found' });
    }

    if (user.emp_no !== empNo) {
      return res.status(400).json({ msg: 'Invalid Employee Number for this email' });
    }

    res.status(200).json({ msg: 'Employee verified' });
  } catch (error) {
    console.error('Verify employee error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
});

// Step 3: Reset password with validation
router.post('/forgot-password/reset', async (req, res) => {
  const { email, empNo, newPassword, confirmPassword } = req.body;

  if (!email || !empNo || !newPassword || !confirmPassword) {
    return res.status(400).json({ msg: 'All fields are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ msg: 'Passwords do not match' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
  }

  try {
    // Validate both email and employee number
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.emp_no !== empNo) {
      return res.status(400).json({ msg: 'Employee number does not match for this email' });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.status(200).json({ msg: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
});

module.exports = router;