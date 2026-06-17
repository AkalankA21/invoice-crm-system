import { Op, fn, col, literal } from 'sequelize';
import { Invoice } from '../models/index.js';
import { AppError } from './AppError.js';
import { isValidId } from './validators.js';

const PAYMENT_STATUSES = ['Pending', 'Advance Paid', 'Fully Paid'];

export const parseDate = (value, label) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`Invalid ${label} date`, 400);
  }
  return date;
};

export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const buildInvoiceWhere = (query = {}) => {
  const where = {};
  const { customerId, paymentStatus, search, startDate, endDate } = query;

  if (customerId) {
    if (!isValidId(customerId)) {
      throw new AppError('Invalid customer ID', 400);
    }
    where.customerId = Number(customerId);
  }

  if (paymentStatus) {
    if (!PAYMENT_STATUSES.includes(paymentStatus)) {
      throw new AppError(
        `Invalid payment status. Must be one of: ${PAYMENT_STATUSES.join(', ')}`,
        400
      );
    }
    where.paymentStatus = paymentStatus;
  }

  if (search?.trim()) {
    where.invoiceNumber = { [Op.like]: `%${search.trim()}%` };
  }

  const start = parseDate(startDate, 'start');
  const end = parseDate(endDate, 'end');

  if (start || end) {
    where.issueDate = {};
    if (start) {
      start.setHours(0, 0, 0, 0);
      where.issueDate[Op.gte] = start;
    }
    if (end) {
      end.setHours(23, 59, 59, 999);
      where.issueDate[Op.lte] = end;
    }
    if (start && end && start > end) {
      throw new AppError('startDate cannot be after endDate', 400);
    }
  }

  return where;
};

export const emptyStatusBreakdown = () =>
  PAYMENT_STATUSES.reduce((acc, status) => {
    acc[status] = { count: 0, grandTotal: 0, amountPaid: 0, outstanding: 0 };
    return acc;
  }, {});

export const formatStatusBreakdown = (rows = []) => {
  const breakdown = emptyStatusBreakdown();

  for (const row of rows) {
    const status = row.paymentStatus || row._id;
    if (!status || !breakdown[status]) continue;
    breakdown[status] = {
      count: Number(row.count),
      grandTotal: Number(Number(row.grandTotal || 0).toFixed(2)),
      amountPaid: Number(Number(row.amountPaid || 0).toFixed(2)),
      outstanding: Number(Number(row.outstanding || 0).toFixed(2)),
    };
  }

  return breakdown;
};

export const getInvoiceStats = async (where = {}) => {
  const totals = await Invoice.findOne({
    where,
    attributes: [
      [fn('COUNT', col('id')), 'totalInvoices'],
      [fn('SUM', col('amountPaid')), 'totalRevenue'],
      [fn('SUM', col('grandTotal')), 'totalGrandTotal'],
      [literal('SUM(GREATEST(0, grandTotal - amountPaid))'), 'totalOutstanding'],
    ],
    raw: true,
  });

  const byStatusRows = await Invoice.findAll({
    where,
    attributes: [
      'paymentStatus',
      [fn('COUNT', col('id')), 'count'],
      [fn('SUM', col('grandTotal')), 'grandTotal'],
      [fn('SUM', col('amountPaid')), 'amountPaid'],
      [literal('SUM(GREATEST(0, grandTotal - amountPaid))'), 'outstanding'],
    ],
    group: ['paymentStatus'],
    raw: true,
  });

  return {
    totals: {
      totalInvoices: Number(totals?.totalInvoices || 0),
      totalRevenue: Number(totals?.totalRevenue || 0),
      totalGrandTotal: Number(totals?.totalGrandTotal || 0),
      totalOutstanding: Number(totals?.totalOutstanding || 0),
    },
    byStatus: formatStatusBreakdown(byStatusRows),
  };
};

export { PAYMENT_STATUSES };
