import { Op } from 'sequelize';
import { Expense, User } from '../models/index.js';
import { expenseQuerySchema, parse } from '../validators/expense.js';

const columns = ['id', 'title', 'amount', 'category', 'date', 'paymentMethod', 'description', 'status', 'createdBy', 'createdByName'];
const numericColumns = new Set([0, 2, 8]);

function rowValues(row) {
  return [row.id, row.title, row.amount, row.category, row.date, row.paymentMethod, row.description, row.status, row.createdBy, row.creator?.name];
}

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function buildCsv(rows) {
  return [columns.join(','), ...rows.map(row => rowValues(row).map(csvEscape).join(','))].join('\r\n');
}

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildExcel(rows) {
  const header = `<Row>${columns.map(column => `<Cell><Data ss:Type="String">${xmlEscape(column)}</Data></Cell>`).join('')}</Row>`;
  const body = rows.map(row => {
    const cells = rowValues(row).map((value, index) => {
      if (numericColumns.has(index)) {
        const number = Number(value);
        return `<Cell><Data ss:Type="Number">${Number.isFinite(number) ? number : 0}</Data></Cell>`;
      }
      return `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
    }).join('');
    return `<Row>${cells}</Row>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Expenses"><Table>${header}${body}</Table></Worksheet></Workbook>`;
}

export const exportExpenses = async (req, res) => {
  const q = parse(expenseQuerySchema, req.query);
  const where = { deletedAt: null };
  if (req.user.role !== 'ADMIN') where.createdBy = req.user.id;
  if (q.status) where.status = q.status.toUpperCase();
  if (q.category) where.category = q.category;
  if (q.from || q.to) {
    where.date = {
      ...(q.from ? { [Op.gte]: q.from } : {}),
      ...(q.to ? { [Op.lte]: q.to } : {})
    };
  }
  if (q.search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${q.search}%` } },
      { description: { [Op.like]: `%${q.search}%` } }
    ];
  }

  const configuredMax = Number(process.env.EXPORT_MAX_ROWS || 10000);
  const maxRows = Number.isFinite(configuredMax) && configuredMax > 0 ? configuredMax : 10000;
  const rows = await Expense.findAll({
    where,
    include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }],
    order: [[q.sort || 'date', q.order ? q.order.toUpperCase() : 'DESC']],
    limit: maxRows
  });

  if (q.format === 'xls') {
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses.xls"');
    res.send(buildExcel(rows));
    return;
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
  res.send('\uFEFF' + buildCsv(rows));
};
