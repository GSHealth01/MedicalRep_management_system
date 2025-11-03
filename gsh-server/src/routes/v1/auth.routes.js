const express = require('express');
const { prisma } = require('../../../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('../../config/env');

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
    return res.status(400).json({ msg: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ msg: 'Invalid credentials' });
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

module.exports = router;