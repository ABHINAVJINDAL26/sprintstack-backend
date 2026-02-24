const authService = require('../services/authService');
const { sendTokenResponse } = require('../utils/token');

async function register(req, res, next) {
  try {
    const user = await authService.registerUser(req.body);
    sendTokenResponse(user, 201, res);
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const user = await authService.loginUser(req.body);
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
}

async function getProfile(req, res, next) {
  try {
    const user = await authService.getProfile(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
}

module.exports = { register, login, getProfile };
