const User = require('../models/userModel');
const AppError = require('../utils/appError');
const { sendTokenResponse } = require('../utils/token');

async function registerUser(payload) {
  const { name, email, password, role, organization } = payload;

  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already registered', 409);

  const user = await User.create({ name, email, password, role, organization });
  return user;
}

async function loginUser(payload) {
  const { email, password } = payload;
  if (!email || !password) throw new AppError('Please provide email and password', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError('Invalid credentials', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid credentials', 401);

  return user;
}

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

module.exports = { registerUser, loginUser, getProfile };
