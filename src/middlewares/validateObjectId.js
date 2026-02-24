const mongoose = require('mongoose');
const AppError = require('../utils/appError');

const validateObjectId = (paramName) => (req, _res, next) => {
  const value = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return next(new AppError(`Invalid ${paramName}`, 400));
  }
  next();
};

module.exports = { validateObjectId };