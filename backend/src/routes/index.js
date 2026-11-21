import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as auth from '../controllers/authController.js';
import * as expenses from '../controllers/expenseController.js';
import * as dashboard from '../controllers/dashboardController.js';
import * as reports from '../controllers/reportController.js';

const router = express.Router();

router.post('/auth/login', asyncHandler(auth.login));
router.use(authenticate);
router.get('/expenses', asyncHandler(expenses.list));
router.post('/expenses', asyncHandler(expenses.create));
router.get('/expenses/:id', asyncHandler(expenses.getOne));
router.get('/expenses/:id/audits', asyncHandler(expenses.audits));
router.patch('/expenses/:id', asyncHandler(expenses.update));
router.delete('/expenses/:id', asyncHandler(expenses.remove));
router.post('/expenses/:id/approve', authorize('ADMIN'), asyncHandler(expenses.approve));
router.post('/expenses/:id/reject', authorize('ADMIN'), asyncHandler(expenses.reject));
router.get('/dashboard/summary', asyncHandler(dashboard.summary));
router.get('/reports/expenses/export', asyncHandler(reports.exportExpenses));

export default router;
