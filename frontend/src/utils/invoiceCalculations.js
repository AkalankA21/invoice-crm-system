export const calculateLineTotal = (quantity, unitPrice) => {
  const qty = Number(quantity) || 0;
  const price = Number(unitPrice) || 0;
  return Number((qty * price).toFixed(2));
};

export const calculateInvoiceTotals = (items, discountPercent = 0, taxPercent = 0) => {
  const subtotal = items.reduce(
    (sum, item) => sum + calculateLineTotal(item.quantity, item.unitPrice),
    0
  );

  const roundedSubtotal = Number(subtotal.toFixed(2));
  const discountAmount = Number(((roundedSubtotal * (Number(discountPercent) || 0)) / 100).toFixed(2));
  const taxable = Number((roundedSubtotal - discountAmount).toFixed(2));
  const taxAmount = Number(((taxable * (Number(taxPercent) || 0)) / 100).toFixed(2));
  const grandTotal = Number((taxable + taxAmount).toFixed(2));

  return {
    subtotal: roundedSubtotal,
    discountAmount,
    taxAmount,
    grandTotal,
  };
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
