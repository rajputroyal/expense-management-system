import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import HttpError from '../utils/httpError.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Authentication token is required');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id, { attributes: ['id','name','email','role','isActive'] });
    if (!user || !user.isActive) throw new HttpError(401, 'Invalid or inactive user');
    req.user = user;
    next();
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(401, 'Invalid or expired token'));
  }
}

export function authorize(...roles) {
  return (req, res, next) => roles.includes(req.user.role)
    ? next()
    : next(new HttpError(403, 'You are not authorized to perform this action'));
}
