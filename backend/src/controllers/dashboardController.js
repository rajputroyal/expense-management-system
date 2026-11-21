import { QueryTypes } from 'sequelize';
import { sequelize } from '../models/index.js';

export const summary = async (req, res) => {
  const userFilter = req.user.role === 'ADMIN' ? '' : ' AND created_by = :userId';
  const replacements = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };

  const monthExpr = `COALESCE(SUM(CASE WHEN YEAR(date)=YEAR(CURDATE()) AND MONTH(date)=MONTH(CURDATE()) THEN amount ELSE 0 END),0)`;
  const yearExpr = `COALESCE(SUM(CASE WHEN YEAR(date)=YEAR(CURDATE()) THEN amount ELSE 0 END),0)`;

  const [totals, categories, trends, statuses, highest] = await Promise.all([
    sequelize.query(`SELECT ${monthExpr} monthlyTotal, ${yearExpr} yearlyTotal FROM expenses WHERE deleted_at IS NULL${userFilter}`, { type: QueryTypes.SELECT, replacements }),
    sequelize.query(`SELECT category, SUM(amount) total FROM expenses WHERE deleted_at IS NULL${userFilter} GROUP BY category ORDER BY total DESC`, { type: QueryTypes.SELECT, replacements }),
    sequelize.query(`SELECT DATE_FORMAT(date,'%Y-%m') month, SUM(amount) total FROM expenses WHERE deleted_at IS NULL AND date >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)${userFilter} GROUP BY DATE_FORMAT(date,'%Y-%m') ORDER BY month`, { type: QueryTypes.SELECT, replacements }),
    sequelize.query(`SELECT status, COUNT(*) count FROM expenses WHERE deleted_at IS NULL${userFilter} GROUP BY status`, { type: QueryTypes.SELECT, replacements }),
    sequelize.query(`SELECT id,title,amount,category,date FROM expenses WHERE deleted_at IS NULL${userFilter} ORDER BY amount DESC LIMIT 1`, { type: QueryTypes.SELECT, replacements })
  ]);

  res.json({ success: true, data: { totals: totals[0], categories, monthlyTrends: trends, statusBreakdown: statuses, highestExpense: highest[0] || null } });
};
