const User = require('../models/userModel');
const AppError = require('../utils/appError');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

async function googleAuthUser(payload) {
  const { idToken, role, organization } = payload;

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new AppError('Google auth is not configured on server', 500);
  }

  if (!idToken) throw new AppError('Google ID token is required', 400);

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const tokenPayload = ticket.getPayload();
  const email = tokenPayload?.email;
  const name = tokenPayload?.name;
  const emailVerified = tokenPayload?.email_verified;

  if (!email || !name || !emailVerified) {
    throw new AppError('Invalid Google account details', 401);
  }

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      password: `${Math.random().toString(36).slice(-8)}Aa1!`,
      role: role || 'developer',
      organization,
    });
    return user;
  }

  if (organization && user.organization !== organization) {
    user.organization = organization;
    await user.save();
  }

  return user;
}

module.exports = { registerUser, loginUser, getProfile, googleAuthUser };
