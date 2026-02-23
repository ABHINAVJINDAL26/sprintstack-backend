const AppError = require('../utils/appError');
const { verifyAccessToken } = require('../utils/token');

function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError('Unauthorized', 401);
    }

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email
    };

    return next();
  } catch (_error) {
    return next(new AppError('Invalid or expired token', 401));
  }
}

module.exports = {
  authenticate
};
