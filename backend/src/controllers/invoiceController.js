import { fn, col, literal } from 'sequelize';
import { Customer, Invoice } from '../models/index.js';
import { generateInvoicePdf } from '../services/pdfInvoiceService.js';
import {
  applyPaymentStatusUpdate,
  createInvoiceWithItems,
} from '../services/invoiceService.js';
import { sendInvoiceSms, sendPaymentStatusSms } from '../services/smsService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPublicInvoiceUrl } from '../utils/publicInvoiceUrl.js';
import { sanitizeInvoiceForAdmin, invoiceIncludes } from '../utils/invoiceHelpers.js';
import { formatInvoiceForApi } from '../utils/formatters.js';
import {
  buildInvoiceWhere,
  emptyStatusBreakdown,
  formatStatusBreakdown,
  parsePagination,
  PAYMENT_STATUSES,
} from '../utils/invoiceQuery.js';
import { assertValidId } from '../utils/validators.js';

const validateItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('At least one invoice item is required', 400);
  }

  for (const item of items) {
    if (!item.description?.trim()) {
      throw new AppError('Each item must have a description', 400);
    }
    if (item.quantity == null || Number(item.quantity) <= 0) {
      throw new AppError('Each item must have a quantity greater than 0', 400);
    }
    if (item.unitPrice == null || Number(item.unitPrice) < 0) {
      throw new AppError('Each item must have a valid unit price', 400);
    }
  }
};

const loadInvoiceById = async (id, { withSecrets = false } = {}) => {
  const Model = withSecrets ? Invoice.unscoped() : Invoice;
  return Model.findOne({
    where: { id },
    include: invoiceIncludes,
  });
};

/**
 * Dashboard analytics using MySQL aggregation (sequelize.fn + GROUP BY).
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const totals = await Invoice.findOne({
    attributes: [
      [fn('COUNT', col('id')), 'totalInvoices'],
      [fn('SUM', col('amountPaid')), 'totalRevenue'],
      [fn('SUM', col('grandTotal')), 'totalGrandTotal'],
      [literal('SUM(GREATEST(0, grandTotal - amountPaid))'), 'totalOutstanding'],
    ],
    raw: true,
  });

  const byStatusRows = await Invoice.findAll({
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

  const byStatus = formatStatusBreakdown(byStatusRows);

  res.status(200).json({
    success: true,
    data: {
      totalInvoices: Number(totals?.totalInvoices || 0),
      totalRevenue: Number(Number(totals?.totalRevenue || 0).toFixed(2)),
      totalGrandTotal: Number(Number(totals?.totalGrandTotal || 0).toFixed(2)),
      totalOutstanding: Number(Number(totals?.totalOutstanding || 0).toFixed(2)),
      byStatus,
      statusOrder: Object.keys(emptyStatusBreakdown()),
    },
  });
});

export const createInvoice = asyncHandler(async (req, res) => {
  const { customerId, items, discount, tax, dueDate, notes, amountPaid, issueDate } = req.body;

  if (!customerId) {
    throw new AppError('A valid customer ID is required', 400);
  }
  assertValidId(customerId, 'customer ID');

  validateItems(items);

  const customer = await Customer.findOne({
    where: { id: Number(customerId), isActive: true },
  });
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const invoice = await createInvoiceWithItems({
    customerId: Number(customerId),
    items,
    discount,
    tax,
    dueDate,
    issueDate,
    notes,
    amountPaid,
    createdById: req.user.id,
  });

  const fullInvoice = await loadInvoiceById(invoice.id, { withSecrets: true });
  const publicViewUrl = buildPublicInvoiceUrl(fullInvoice.publicViewToken);

  let smsNotification = { sent: false };

  try {
    const smsResult = await sendInvoiceSms({
      phone: customer.phone,
      customerName: customer.name,
      invoiceNumber: fullInvoice.invoiceNumber,
      publicUrl: publicViewUrl,
      grandTotal: fullInvoice.grandTotal,
    });

    smsNotification = { sent: true, messageId: smsResult.messageId, provider: smsResult.provider };
  } catch (smsError) {
    smsNotification = { sent: false, error: smsError.message };
    console.error(`Invoice created but SMS failed: ${smsError.message}`);
  }

  res.status(201).json({
    success: true,
    message: smsNotification.sent
      ? 'Invoice created successfully. SMS notification sent to customer.'
      : 'Invoice created successfully. SMS notification could not be sent.',
    smsNotification,
    data: sanitizeInvoiceForAdmin(fullInvoice, publicViewUrl),
  });
});

export const getInvoices = asyncHandler(async (req, res) => {
  const where = buildInvoiceWhere(req.query);
  const { page, limit, offset } = parsePagination(req.query);

  const total = await Invoice.count({ where });

  const invoices = await Invoice.findAll({
    where,
    order: [['issueDate', 'DESC']],
    offset,
    limit,
    include: invoiceIncludes,
  });

  const data = invoices.map((invoice) => {
    const formatted = formatInvoiceForApi(invoice);
    return {
      ...formatted,
      balanceDue: Number(Math.max(0, formatted.grandTotal - formatted.amountPaid).toFixed(2)),
    };
  });

  res.status(200).json({
    success: true,
    count: data.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data,
  });
});

export const getInvoiceById = asyncHandler(async (req, res) => {
  const id = assertValidId(req.params.id, 'invoice ID');

  const invoice = await loadInvoiceById(id, { withSecrets: true });
  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  const publicViewUrl = buildPublicInvoiceUrl(invoice.publicViewToken);
  const formatted = sanitizeInvoiceForAdmin(invoice, publicViewUrl);

  res.status(200).json({
    success: true,
    data: {
      ...formatted,
      balanceDue: Number(Math.max(0, formatted.grandTotal - formatted.amountPaid).toFixed(2)),
    },
  });
});

export const updateInvoiceStatus = asyncHandler(async (req, res) => {
  const id = assertValidId(req.params.id, 'invoice ID');
  const { paymentStatus, amountPaid } = req.body;

  if (!paymentStatus) {
    throw new AppError('paymentStatus is required', 400);
  }

  if (!PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new AppError(
      `Invalid payment status. Must be one of: ${PAYMENT_STATUSES.join(', ')}`,
      400
    );
  }

  const invoice = await Invoice.unscoped().findOne({
    where: { id },
    include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'phone', 'email'] }],
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  const previousStatus = invoice.paymentStatus;

  try {
    applyPaymentStatusUpdate(invoice, { paymentStatus, amountPaid });
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(err.message, 400);
  }

  await invoice.save();

  const fullInvoice = await loadInvoiceById(id, { withSecrets: true });
  const publicViewUrl = buildPublicInvoiceUrl(fullInvoice.publicViewToken);
  const formatted = sanitizeInvoiceForAdmin(fullInvoice, publicViewUrl);
  const balanceDue = Number(Math.max(0, formatted.grandTotal - formatted.amountPaid).toFixed(2));

  let smsNotification = { sent: false };

  if (previousStatus !== invoice.paymentStatus && invoice.customer?.phone) {
    try {
      const smsResult = await sendPaymentStatusSms({
        phone: invoice.customer.phone,
        customerName: invoice.customer.name,
        invoiceNumber: invoice.invoiceNumber,
        paymentStatus: invoice.paymentStatus,
        amountPaid: invoice.amountPaid,
        balanceDue,
        publicUrl: publicViewUrl,
      });

      smsNotification = { sent: true, messageId: smsResult.messageId, provider: smsResult.provider };
    } catch (smsError) {
      smsNotification = { sent: false, error: smsError.message };
    }
  }

  res.status(200).json({
    success: true,
    message:
      previousStatus === invoice.paymentStatus
        ? 'Invoice status unchanged'
        : 'Invoice payment status updated successfully',
    smsNotification,
    data: {
      ...formatted,
      balanceDue,
      previousStatus,
    },
  });
});

export const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const id = assertValidId(req.params.id, 'invoice ID');

  const invoice = await loadInvoiceById(id);
  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (!invoice.customer) {
    throw new AppError('Customer details not found for this invoice', 404);
  }

  const formatted = formatInvoiceForApi(invoice);
  const pdfBuffer = await generateInvoicePdf(formatted, formatted.customer);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.send(pdfBuffer);
});

export const resendInvoiceSms = asyncHandler(async (req, res) => {
  const id = assertValidId(req.params.id, 'invoice ID');

  const invoice = await Invoice.unscoped().findOne({
    where: { id },
    include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }],
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (!invoice.customer?.phone) {
    throw new AppError('Customer phone number not available', 400);
  }

  const publicViewUrl = buildPublicInvoiceUrl(invoice.publicViewToken);

  const smsResult = await sendInvoiceSms({
    phone: invoice.customer.phone,
    customerName: invoice.customer.name,
    invoiceNumber: invoice.invoiceNumber,
    publicUrl: publicViewUrl,
    grandTotal: invoice.grandTotal,
  });

  res.status(200).json({
    success: true,
    message: 'SMS notification resent successfully',
    smsNotification: {
      sent: true,
      messageId: smsResult.messageId,
      provider: smsResult.provider,
    },
  });
});
