export default (err, req, res, next) => {
  let status = err.status;
  if (!status) {
    if (err.name === 'SequelizeValidationError' || err.name === 'ValidationError' || err.name === 'SequelizeDatabaseError') status = 400;
    else if (err.name === 'SequelizeUniqueConstraintError') status = 409;
    else status = 500;
  }
  if (status >= 500) console.error(err);
  const message = status === 500
    ? 'Internal server error'
    : (err.name === 'SequelizeUniqueConstraintError' ? 'A record with these values already exists' : err.message);
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && status === 500 ? { detail: err.message } : {})
  });
};
