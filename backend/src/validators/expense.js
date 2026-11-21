import Joi from 'joi';
import HttpError from '../utils/httpError.js';
import { EXPENSE_CATEGORIES } from '../constants/categories.js';

export const expenseSchema = Joi.object({
  title: Joi.string().trim().min(2).max(180).required(),
  amount: Joi.number().positive().precision(2).required(),
  category: Joi.string().valid(...EXPENSE_CATEGORIES).required(),
  date: Joi.date().iso().required(),
  paymentMethod: Joi.string().valid('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'OTHER').required(),
  description: Joi.string().trim().min(1).max(5000).required()
});

export const expenseQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(180).allow(''),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').insensitive(),
  category: Joi.string().valid(...EXPENSE_CATEGORIES).allow(''),
  from: Joi.date().iso().raw(),
  to: Joi.date().iso().raw(),
  sort: Joi.string().valid('date', 'amount', 'title', 'createdAt'),
  order: Joi.string().valid('ASC', 'DESC').insensitive(),
  format: Joi.string().valid('csv', 'xls').default('csv')
}).unknown(true);

export const idSchema = Joi.number().integer().positive().required();
export const versionSchema = Joi.number().integer().min(0).required();
export const approveSchema = Joi.object({ reason: Joi.string().trim().max(500).allow('') }).unknown(true);
export const rejectSchema = Joi.object({ reason: Joi.string().trim().min(1).max(500).required() }).unknown(true);

export function parse(schema, value) {
  const { error, value: result } = schema.validate(value, { abortEarly: false, stripUnknown: true });
  if (error) throw new HttpError(400, error.details.map(x => x.message).join('; '));
  return result;
}
