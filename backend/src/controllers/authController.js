import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { User } from '../models/index.js';
import HttpError from '../utils/httpError.js';

const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });

export const login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) throw new HttpError(400, error.details[0].message);
  const user = await User.findOne({ where: { email: value.email.trim().toLowerCase() } });
  if (!user || !user.isActive || !(await bcrypt.compare(value.password, user.password))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
  res.json({ success: true, message: 'Login successful', data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
};
