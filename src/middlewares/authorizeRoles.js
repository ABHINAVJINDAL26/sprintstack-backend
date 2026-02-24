const AppError = require('../utils/appError');

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Role '${req.user.role}' does not have access to this resource`, 403)
      );
    }
    next();
  };
};

module.exports = { authorizeRoles };
