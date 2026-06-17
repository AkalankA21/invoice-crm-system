import { Customer, InvoiceItem } from '../models/index.js';
import { formatCustomerForApi, formatInvoiceForApi } from './formatters.js';

export const invoiceIncludes = [
  {
    model: Customer,
    as: 'customer',
    attributes: ['id', 'name', 'phone', 'email', 'address', 'company'],
  },
  {
    model: InvoiceItem,
    as: 'items',
    attributes: ['id', 'description', 'quantity', 'unitPrice', 'lineTotal'],
  },
];

export const sanitizeInvoiceForPublic = (invoice) => {
  const formatted = formatInvoiceForApi(invoice);
  return {
    invoiceNumber: formatted.invoiceNumber,
    issueDate: formatted.issueDate,
    dueDate: formatted.dueDate,
    items: formatted.items,
    subtotal: formatted.subtotal,
    discount: formatted.discount,
    tax: formatted.tax,
    grandTotal: formatted.grandTotal,
    amountPaid: formatted.amountPaid,
    balanceDue: Number(Math.max(0, formatted.grandTotal - formatted.amountPaid).toFixed(2)),
    paymentStatus: formatted.paymentStatus,
    notes: formatted.notes,
    customer: formatted.customer
      ? {
          name: formatted.customer.name,
          phone: formatted.customer.phone,
          email: formatted.customer.email,
          company: formatted.customer.company,
          address: formatted.customer.address,
        }
      : null,
  };
};

export const sanitizeInvoiceForAdmin = (invoice, publicViewUrl = null) => {
  const formatted = formatInvoiceForApi(invoice, {
    includePublicViewToken: true,
    publicViewUrl,
  });
  delete formatted.publicViewHash;
  return formatted;
};

export { formatCustomerForApi, formatInvoiceForApi };
