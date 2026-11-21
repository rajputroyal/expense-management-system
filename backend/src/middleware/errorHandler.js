import { isDevelopment } from '../config/environment.js';

export default (err, req, res, next) => {
  let status = err.status;
  if (!status) {
    if (err.name === 'SequelizeValidationError' || err.name === 'ValidationError' || err.name === 'SequelizeDatabaseError') status = 400;
    else if (err.name === 'SequelizeUniqueConstraintError') status = 409;
    else status = 500;
  }

  if (status >= 500) {
    if (isDevelopment) console.error(err);
    else console.error(`[ERROR] ${err.message}`);
  }

  const message = status === 500
    ? 'Internal server error'
    : (err.name === 'SequelizeUniqueConstraintError' ? 'A record with these values already exists' : err.message);

  const response = { success: false, message };

  if (isDevelopment && status >= 500) {
    response.detail = err.message;
    response.stack = err.stack;
  }

  res.status(status).json(response);
};
