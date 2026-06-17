import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { downloadPublicInvoicePdf, getPublicInvoice } from '../api/publicInvoiceApi.js';
import PaymentStatusBadge from '../components/invoices/PaymentStatusBadge.jsx';
import { formatCurrency, formatDate } from '../utils/invoiceCalculations.js';

const formatAddress = (address) => {
  if (!address) return null;
  const parts = [address.street, address.city, address.state, address.postalCode, address.country].filter(
    Boolean
  );
  return parts.length ? parts.join(', ') : null;
};

const PublicInvoicePage = () => {
  const { secureToken } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getPublicInvoice(secureToken);
        setInvoice(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invoice not found or link is invalid.');
      } finally {
        setLoading(false);
      }
    };

    if (secureToken) fetchInvoice();
  }, [secureToken]);

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setDownloading(true);
    try {
      await downloadPublicInvoicePdf(secureToken, invoice.invoiceNumber);
    } catch {
      setError('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Invoice Unavailable</h1>
          <p className="mt-2 text-sm text-slate-500">{error || 'This invoice could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const { company, customer } = invoice;
  const customerAddress = formatAddress(customer?.address);

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-6 flex max-w-4xl justify-center gap-3 px-4">
        <button type="button" onClick={handlePrint} className="btn-primary">
          Print Invoice
        </button>
        <button type="button" onClick={handleDownloadPdf} disabled={downloading} className="btn-secondary">
          {downloading ? 'Downloading...' : 'Download PDF'}
        </button>
      </div>

      <article className="invoice-print mx-auto max-w-4xl bg-white shadow-xl print:max-w-none print:shadow-none">
        <div className="border-b border-slate-200 px-8 py-8 sm:px-12">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div className="flex gap-5">
              <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Logo
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{company?.name || 'Company Name'}</h1>
                {company?.phone && <p className="mt-1 text-sm text-slate-600">Tel: {company.phone}</p>}
                {company?.email && <p className="text-sm text-slate-600">{company.email}</p>}
                {company?.website && <p className="text-sm text-slate-600">{company.website}</p>}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <h2 className="text-3xl font-bold tracking-tight text-brand-600">INVOICE</h2>
              <p className="mt-2 text-sm font-semibold text-slate-900">{invoice.invoiceNumber}</p>
              <div className="mt-3">
                <PaymentStatusBadge status={invoice.paymentStatus} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 border-b border-slate-200 px-8 py-8 sm:grid-cols-2 sm:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bill To</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{customer?.name}</p>
            {customer?.company && <p className="text-sm text-slate-600">{customer.company}</p>}
            {customer?.phone && <p className="mt-1 text-sm text-slate-600">{customer.phone}</p>}
            {customer?.email && <p className="text-sm text-slate-600">{customer.email}</p>}
            {customerAddress && <p className="mt-1 text-sm text-slate-600">{customerAddress}</p>}
          </div>
          <div className="sm:text-right">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between sm:justify-end sm:gap-8">
                <dt className="text-slate-500">Issue Date</dt>
                <dd className="font-medium text-slate-900">{formatDate(invoice.issueDate)}</dd>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-8">
                <dt className="text-slate-500">Due Date</dt>
                <dd className="font-medium text-slate-900">{formatDate(invoice.dueDate)}</dd>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-8">
                <dt className="text-slate-500">Amount Paid</dt>
                <dd className="font-medium text-slate-900">{formatCurrency(invoice.amountPaid)}</dd>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-8">
                <dt className="text-slate-500">Balance Due</dt>
                <dd className="font-semibold text-brand-600">{formatCurrency(invoice.balanceDue)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="px-8 py-8 sm:px-12">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Qty
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item, index) => (
                <tr key={item._id || index}>
                  <td className="px-4 py-4 text-sm text-slate-900">{item.description}</td>
                  <td className="px-4 py-4 text-right text-sm text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-4 text-right text-sm text-slate-600">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 flex justify-end">
            <dl className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="font-medium text-slate-900">{formatCurrency(invoice.subtotal)}</dd>
              </div>
              {invoice.discount?.amount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">
                    Discount
                    {invoice.discount.type === 'percentage' ? ` (${invoice.discount.value}%)` : ''}
                  </dt>
                  <dd className="font-medium text-red-600">- {formatCurrency(invoice.discount.amount)}</dd>
                </div>
              )}
              {invoice.tax?.amount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Tax ({invoice.tax.rate}%)</dt>
                  <dd className="font-medium text-slate-900">{formatCurrency(invoice.tax.amount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                <dt className="font-semibold text-slate-900">Grand Total</dt>
                <dd className="text-xl font-bold text-brand-600">{formatCurrency(invoice.grandTotal)}</dd>
              </div>
            </dl>
          </div>

          {invoice.notes && (
            <div className="mt-8 rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Notes</p>
              <p className="mt-1 text-sm text-slate-700">{invoice.notes}</p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-8 py-8 sm:px-12 print:bg-white">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
            Payment Instructions
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Please transfer the balance due to our bank account before the due date. Include your
            invoice number <strong>{invoice.invoiceNumber}</strong> as the payment reference. For
            payment queries, contact us at {company?.phone || 'our billing department'}
            {company?.email ? ` or ${company.email}` : ''}.
          </p>
          <p className="mt-6 text-center text-xs text-slate-400">
            Thank you for your business.
          </p>
        </div>
      </article>
    </div>
  );
};

export default PublicInvoicePage;
