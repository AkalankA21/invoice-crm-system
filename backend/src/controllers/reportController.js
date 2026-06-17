import { Invoice } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  buildInvoiceWhere,
  getInvoiceStats,
  parsePagination,
} from '../utils/invoiceQuery.js';
import { formatInvoiceForApi } from '../utils/formatters.js';
import { invoiceIncludes } from '../utils/invoiceHelpers.js';

export const getReports = asyncHandler(async (req, res) => {
  const where = buildInvoiceWhere(req.query);
  const { page, limit, offset } = parsePagination(req.query);

  const [{ totals, byStatus }, { rows: invoices, count: total }] = await Promise.all([
    getInvoiceStats(where),
    Invoice.findAndCountAll({
      where,
      order: [['issueDate', 'DESC']],
      offset,
      limit,
      include: invoiceIncludes,
    }),
  ]);

  const summary = {
    invoiceCount: totals.totalInvoices,
    totalRevenue: Number(totals.totalRevenue.toFixed(2)),
    totalGrandTotal: Number(totals.totalGrandTotal.toFixed(2)),
    totalOutstanding: Number(totals.totalOutstanding.toFixed(2)),
    byStatus,
  };

  const reportRows = invoices.map((invoice) => {
    const formatted = formatInvoiceForApi(invoice);
    return {
      id: formatted.id,
      invoiceNumber: formatted.invoiceNumber,
      issueDate: formatted.issueDate,
      dueDate: formatted.dueDate,
      customer: formatted.customer,
      subtotal: formatted.subtotal,
      discount: formatted.discount,
      tax: formatted.tax,
      grandTotal: formatted.grandTotal,
      amountPaid: formatted.amountPaid,
      balanceDue: Number(Math.max(0, formatted.grandTotal - formatted.amountPaid).toFixed(2)),
      paymentStatus: formatted.paymentStatus,
      createdAt: formatted.createdAt,
    };
  });

  res.status(200).json({
    success: true,
    filters: {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      customerId: req.query.customerId || null,
      paymentStatus: req.query.paymentStatus || null,
      search: req.query.search || null,
    },
    summary,
    count: reportRows.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: reportRows,
  });
});
