const toNumber = (value) => Number(value || 0);

export const formatUserForApi = (user) => {
  if (!user) return null;
  const json = user.toJSON ? user.toJSON() : user;
  return {
    id: json.id,
    _id: json.id,
    name: json.name,
    email: json.email,
    role: json.role,
    isActive: json.isActive,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  };
};

export const formatCustomerForApi = (customer) => {
  if (!customer) return null;
  const json = customer.toJSON ? customer.toJSON() : customer;
  return {
    id: json.id,
    _id: json.id,
    name: json.name,
    phone: json.phone,
    email: json.email,
    address: json.address || {},
    company: json.company,
    notes: json.notes,
    isActive: json.isActive,
    createdById: json.createdById,
    createdBy: json.createdBy ? formatUserForApi(json.createdBy) : undefined,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  };
};

export const formatInvoiceItemForApi = (item) => {
  if (!item) return null;
  const json = item.toJSON ? item.toJSON() : item;
  return {
    id: json.id,
    _id: json.id,
    description: json.description,
    quantity: toNumber(json.quantity),
    unitPrice: toNumber(json.unitPrice),
    lineTotal: toNumber(json.lineTotal),
  };
};

export const formatInvoiceForApi = (invoice, options = {}) => {
  if (!invoice) return null;
  const json = invoice.toJSON ? invoice.toJSON() : invoice;

  const formatted = {
    id: json.id,
    _id: json.id,
    invoiceNumber: json.invoiceNumber,
    customerId: json.customerId,
    customer: json.customer ? formatCustomerForApi(json.customer) : undefined,
    issueDate: json.issueDate,
    dueDate: json.dueDate,
    items: (json.items || []).map(formatInvoiceItemForApi),
    subtotal: toNumber(json.subtotal),
    discount: {
      type: json.discountType,
      value: toNumber(json.discountValue),
      amount: toNumber(json.discountAmount),
    },
    tax: {
      rate: toNumber(json.taxRate),
      amount: toNumber(json.taxAmount),
    },
    grandTotal: toNumber(json.grandTotal),
    amountPaid: toNumber(json.amountPaid),
    paymentStatus: json.paymentStatus,
    notes: json.notes,
    createdById: json.createdById,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  };

  if (options.includePublicViewToken && json.publicViewToken) {
    formatted.publicViewToken = json.publicViewToken;
  }

  if (options.publicViewUrl) {
    formatted.publicViewUrl = options.publicViewUrl;
  }

  return formatted;
};
