const express = require('express');
const { prisma } = require('../../../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('../../config/env');
const crypto = require('crypto');

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
      designation: email === 'admin@gsh.com' ? 'ADMIN' : 'USER'
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
    if (!user.agency_id || !user.range_id) {
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

// Step 1: Check if staff number exists and return security question
router.post('/forgot-password/step1', async (req, res) => {
  const { empNo } = req.body;

  if (!empNo) {
    return res.status(400).json({ msg: 'Staff Number is required' });
  }

  try {
    // Find user by employee number
    const user = await prisma.user.findUnique({
      where: { emp_no: empNo }
    });

    if (!user) {
      return res.status(404).json({ msg: 'Staff Number not found' });
    }

    if (!user.security_question) {
      return res.status(400).json({ msg: 'No security question set for this staff member. Please contact administrator.' });
    }

    res.status(200).json({
      msg: 'Staff Number found',
      securityQuestion: user.security_question,
      userId: user.id
    });

  } catch (error) {
    console.error('Forgot password step 1 error:', error);
    return res.status(500).json({ msg: 'Internal server error' });
  }
});

// Step 2: Verify security answer
router.post('/forgot-password/step2', async (req, res) => {
  const { userId, answer } = req.body;

  if (!userId || !answer) {
    return res.status(400).json({ msg: 'User ID and answer are required' });
  }

  try {
    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (!user.security_answer) {
      return res.status(400).json({ msg: 'No security answer set for this user' });
    }

    // Verify the answer
    const isAnswerCorrect = await bcrypt.compare(answer, user.security_answer);

    if (!isAnswerCorrect) {
      return res.status(400).json({ msg: 'The answer you provided does not match our records. Please try again or contact your administrator.' });
    }

    res.status(200).json({
      msg: 'Answer verified successfully',
      userId: user.id
    });

  } catch (error) {
    console.error('Forgot password step 2 error:', error);
    return res.status(500).json({ msg: 'Internal server error' });
  }
});

// Step 3: Reset password
router.post('/forgot-password/step3', async (req, res) => {
  const { userId, newPassword, confirmPassword } = req.body;

  if (!userId || !newPassword || !confirmPassword) {
    return res.status(400).json({ msg: 'All fields are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ msg: 'Passwords do not match' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
  }

  try {
    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.status(200).json({
      msg: 'Password reset successful. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Forgot password step 3 error:', error);
    return res.status(500).json({ msg: 'Internal server error' });
  }
});

module.exports = router;