const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');
const { signAccessToken } = require('../utils/token');
const UserModel = require('../models/userModel');

async function registerUser(payload) {
  const existing = UserModel.findByEmail(payload.email);
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const user = UserModel.createUser({
    ...payload,
    password: hashedPassword
  });

  return UserModel.toPublicUser(user);
}

async function loginUser(payload) {
  const user = UserModel.findByEmail(payload.email);
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isValidPassword = await bcrypt.compare(payload.password, user.password);
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = signAccessToken({ sub: user.id, role: user.role, email: user.email });

  return {
    token,
    user: UserModel.toPublicUser(user)
  };
}

function getProfile(userId) {
  const user = UserModel.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return UserModel.toPublicUser(user);
}

module.exports = {
  registerUser,
  loginUser,
  getProfile
};
