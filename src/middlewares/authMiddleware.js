const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return next(new AppError('Not authorized. No token provided.', 401));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new AppError('User not found. Token invalid.', 401));

    req.user = user;
    next();
  } catch (err) {
    return next(new AppError('Not authorized. Token invalid or expired.', 401));
  }
};

module.exports = { protect };
