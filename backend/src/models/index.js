import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { EXPENSE_CATEGORIES } from '../constants/categories.js';

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(190), allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('ADMIN', 'USER'), allowNull: false, defaultValue: 'USER' },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' }
}, { tableName: 'users', indexes: [{ unique: true, fields: ['email'] }] });

const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(180), allowNull: false },
  amount: { type: DataTypes.DECIMAL(12,2), allowNull: false, validate: { min: 0.01 } },
  category: { type: DataTypes.ENUM(...EXPENSE_CATEGORIES), allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  paymentMethod: { type: DataTypes.ENUM('CASH','CARD','UPI','BANK_TRANSFER','OTHER'), allowNull: false, field: 'payment_method' },
  description: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('PENDING','APPROVED','REJECTED'), allowNull: false, defaultValue: 'PENDING' },
  createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'created_by' },
  deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
  version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, { tableName: 'expenses', paranoid: false, indexes: [{ fields: ['created_by','deleted_at'] }, { fields: ['status','date'] }, { fields: ['category'] }] });

const ExpenseAudit = sequelize.define('ExpenseAudit', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  action: { type: DataTypes.ENUM('CREATED','UPDATED','DELETED','APPROVED','REJECTED'), allowNull: false },
  reason: { type: DataTypes.STRING(500), allowNull: true },
  performedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'performed_by' },
  expenseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'expense_id' }
}, { tableName: 'expense_audits', updatedAt: false, indexes: [{ fields: ['expense_id','created_at'] }] });

User.hasMany(Expense, { foreignKey: 'createdBy', as: 'expenses' });
Expense.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Expense.hasMany(ExpenseAudit, { foreignKey: 'expenseId', as: 'auditHistory' });
ExpenseAudit.belongsTo(User, { foreignKey: 'performedBy', as: 'actor' });
ExpenseAudit.belongsTo(Expense, { foreignKey: 'expenseId', as: 'expense' });

export { sequelize, User, Expense, ExpenseAudit };
