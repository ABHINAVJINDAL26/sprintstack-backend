const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const user = await authService.registerUser(req.body);
    return res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const data = await authService.loginUser(req.body);
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}

async function profile(req, res, next) {
  try {
    const user = authService.getProfile(req.user.id);
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  profile
};
