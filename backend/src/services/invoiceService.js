import crypto from 'crypto';
import { Op } from 'sequelize';
import { Invoice, InvoiceItem, sequelize } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

export const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const last = await Invoice.unscoped().findOne({
    where: {
      invoiceNumber: { [Op.like]: `${prefix}%` },
    },
    order: [['invoiceNumber', 'DESC']],
    attributes: ['invoiceNumber'],
  });

  let sequence = 1;
  if (last?.invoiceNumber) {
    const parts = last.invoiceNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(lastSeq)) sequence = lastSeq + 1;
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

export const generatePublicCredentials = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const secret = process.env.INVOICE_PUBLIC_TOKEN_SECRET || process.env.JWT_SECRET || 'fallback';
  const hash = crypto.createHmac('sha256', secret).update(token).digest('hex');
  return { publicViewToken: token, publicViewHash: hash };
};

export const verifyPublicToken = (token, storedHash) => {
  const secret = process.env.INVOICE_PUBLIC_TOKEN_SECRET || process.env.JWT_SECRET || 'fallback';
  const hash = crypto.createHmac('sha256', secret).update(token).digest('hex');
  if (hash.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hash, 'utf8'), Buffer.from(storedHash, 'utf8'));
};

export const calculateLineItems = (items) =>
  items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const lineTotal = Number((quantity * unitPrice).toFixed(2));
    return {
      description: item.description.trim(),
      quantity,
      unitPrice,
      lineTotal,
    };
  });

export const calculateInvoiceTotals = (lineItems, discount = {}, tax = {}) => {
  const subtotal = Number(
    lineItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
  );

  const discountType = discount.type === 'percentage' ? 'percentage' : 'fixed';
  const discountValue = Number(discount.value) || 0;

  let discountAmount = 0;
  if (discountValue > 0) {
    discountAmount =
      discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;
  }
  discountAmount = Number(Math.min(discountAmount, subtotal).toFixed(2));

  const taxable = Number((subtotal - discountAmount).toFixed(2));
  const taxRate = Number(tax.rate) || 0;
  const taxAmount = Number(((taxable * taxRate) / 100).toFixed(2));
  const grandTotal = Number((taxable + taxAmount).toFixed(2));

  return {
    subtotal,
    discountType,
    discountValue,
    discountAmount,
    taxRate,
    taxAmount,
    grandTotal,
  };
};

export const resolvePaymentStatus = (grandTotal, amountPaid) => {
  const paid = Number(amountPaid) || 0;
  const total = Number(grandTotal) || 0;

  if (paid <= 0) return { paymentStatus: 'Pending', amountPaid: 0 };
  if (paid >= total) return { paymentStatus: 'Fully Paid', amountPaid: total };
  return { paymentStatus: 'Advance Paid', amountPaid: paid };
};

export const createInvoiceWithItems = async ({
  customerId,
  items,
  discount,
  tax,
  dueDate,
  issueDate,
  notes,
  amountPaid,
  createdById,
}) => {
  const lineItems = calculateLineItems(items);
  const totals = calculateInvoiceTotals(lineItems, discount, tax);
  const payment = resolvePaymentStatus(totals.grandTotal, amountPaid);
  const credentials = generatePublicCredentials();
  const invoiceNumber = await generateInvoiceNumber();

  return sequelize.transaction(async (transaction) => {
    const invoice = await Invoice.create(
      {
        invoiceNumber,
        customerId,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        ...totals,
        ...payment,
        ...credentials,
        notes: notes?.trim() || null,
        createdById,
      },
      { transaction }
    );

    await InvoiceItem.bulkCreate(
      lineItems.map((item) => ({ ...item, invoiceId: invoice.id })),
      { transaction }
    );

    return invoice;
  });
};

export const applyPaymentStatusUpdate = (invoice, { paymentStatus, amountPaid }) => {
  const grandTotal = Number(invoice.grandTotal);

  if (paymentStatus === 'Pending') {
    invoice.paymentStatus = 'Pending';
    invoice.amountPaid = 0;
    return;
  }

  if (paymentStatus === 'Fully Paid') {
    invoice.paymentStatus = 'Fully Paid';
    invoice.amountPaid = grandTotal;
    return;
  }

  if (paymentStatus === 'Advance Paid') {
    const paid =
      amountPaid !== undefined && amountPaid !== null
        ? Number(amountPaid)
        : Number(invoice.amountPaid);

    if (Number.isNaN(paid) || paid <= 0 || paid >= grandTotal) {
      throw new AppError(
        'amountPaid must be greater than 0 and less than the grand total for Advance Paid',
        400
      );
    }

    invoice.paymentStatus = 'Advance Paid';
    invoice.amountPaid = paid;
  }
};
