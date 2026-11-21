import { Op } from 'sequelize';
import { sequelize, Expense, ExpenseAudit, User } from '../models/index.js';
import { expenseSchema, expenseQuerySchema, idSchema, versionSchema, approveSchema, rejectSchema, parse } from '../validators/expense.js';
import HttpError from '../utils/httpError.js';

function validate(body, partial = false) {
  const schema = partial ? expenseSchema.fork(Object.keys(expenseSchema.describe().keys), s => s.optional()) : expenseSchema;
  const value = parse(schema, body);
  if (partial && Object.keys(value).length === 0) throw new HttpError(400, 'At least one field is required');
  return value;
}

function validateId(value) {
  return parse(idSchema, value);
}

function scopeFor(user) {
  return user.role === 'ADMIN' ? {} : { createdBy: user.id };
}

export const list = async (req, res) => {
  const q = parse(expenseQuerySchema, req.query);
  const where = { deletedAt: null, ...scopeFor(req.user) };
  if (q.status) where.status = q.status.toUpperCase();
  if (q.category) where.category = q.category;
  if (q.from || q.to) {
    where.date = { ...(q.from ? { [Op.gte]: q.from } : {}), ...(q.to ? { [Op.lte]: q.to } : {}) };
  }
  if (q.search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${q.search}%` } },
      { description: { [Op.like]: `%${q.search}%` } }
    ];
  }
  const result = await Expense.findAndCountAll({
    where,
    include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }],
    order: [[q.sort || 'date', q.order ? q.order.toUpperCase() : 'DESC']],
    limit: q.limit,
    offset: (q.page - 1) * q.limit
  });
  res.json({
    success: true,
    data: result.rows,
    pagination: { page: q.page, limit: q.limit, total: result.count, totalPages: Math.ceil(result.count / q.limit) }
  });
};

export const create = async (req, res) => {
  const values = validate(req.body);
  const result = await sequelize.transaction(async t => {
    const expense = await Expense.create({ ...values, createdBy: req.user.id }, { transaction: t });
    await ExpenseAudit.create({ expenseId: expense.id, action: 'CREATED', performedBy: req.user.id }, { transaction: t });
    return expense;
  });
  res.status(201).json({ success: true, message: 'Expense created', data: result });
};

export const getOne = async (req, res) => {
  const expense = await Expense.findOne({
    where: { id: validateId(req.params.id), deletedAt: null, ...scopeFor(req.user) },
    include: [
      { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      { model: ExpenseAudit, as: 'auditHistory', include: [{ model: User, as: 'actor', attributes: ['id', 'name'] }] }
    ]
  });
  if (!expense) throw new HttpError(404, 'Expense not found');
  res.json({ success: true, data: expense });
};

export const audits = async (req, res) => {
  const id = validateId(req.params.id);
  const expense = await Expense.findOne({ where: { id, ...scopeFor(req.user) }, attributes: ['id'] });
  if (!expense) throw new HttpError(404, 'Expense not found');
  const audits = await ExpenseAudit.findAll({
    where: { expenseId: id },
    include: [{ model: User, as: 'actor', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']]
  });
  res.json({ success: true, data: audits });
};

export const update = async (req, res) => {
  const { version, ...body } = req.body;
  const values = validate(body, true);
  const where = { id: validateId(req.params.id), deletedAt: null, ...scopeFor(req.user) };
  if (version !== undefined) where.version = parse(versionSchema, version);
  const result = await sequelize.transaction(async t => {
    const expense = await Expense.findOne({ where, transaction: t, lock: t.LOCK.UPDATE });
    if (!expense) throw new HttpError(409, 'Expense not found or it was modified by another user');
    if (expense.status !== 'PENDING') throw new HttpError(409, 'Only pending expenses can be edited');
    await expense.update({ ...values, version: expense.version + 1 }, { transaction: t });
    await ExpenseAudit.create({ expenseId: expense.id, action: 'UPDATED', performedBy: req.user.id }, { transaction: t });
    return expense;
  });
  res.json({ success: true, message: 'Expense updated', data: result });
};

export const remove = async (req, res) => {
  await sequelize.transaction(async t => {
    const expense = await Expense.findOne({
      where: { id: validateId(req.params.id), deletedAt: null, ...scopeFor(req.user) },
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!expense) throw new HttpError(404, 'Expense not found');
    if (expense.status !== 'PENDING' && req.user.role !== 'ADMIN') {
      throw new HttpError(409, 'Only pending expenses can be deleted');
    }
    await expense.update({ deletedAt: new Date() }, { transaction: t });
    await ExpenseAudit.create({ expenseId: expense.id, action: 'DELETED', performedBy: req.user.id }, { transaction: t });
  });
  res.json({ success: true, message: 'Expense deleted' });
};

async function decide(req, res, action) {
  const status = action === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  const body = parse(action === 'REJECTED' ? rejectSchema : approveSchema, req.body || {});
  const reason = body.reason || null;
  await sequelize.transaction(async t => {
    const [count] = await Expense.update(
      { status, version: sequelize.literal('version + 1') },
      { where: { id: validateId(req.params.id), status: 'PENDING', deletedAt: null }, transaction: t }
    );
    if (!count) throw new HttpError(409, 'Expense not found or it has already been processed');
    await ExpenseAudit.create({ expenseId: req.params.id, action, reason, performedBy: req.user.id }, { transaction: t });
  });
  res.json({ success: true, message: `Expense ${status.toLowerCase()}` });
}

export const approve = (req, res) => decide(req, res, 'APPROVED');
export const reject = (req, res) => decide(req, res, 'REJECTED');
