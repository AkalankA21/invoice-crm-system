import PaymentStatusBadge from './PaymentStatusBadge.jsx';
import { formatCurrency, formatDate } from '../../utils/invoiceCalculations.js';

const InvoiceViewModal = ({ isOpen, onClose, invoice, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Invoice Details</h2>
            {invoice && <p className="text-sm text-slate-500">{invoice.invoiceNumber}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
            </div>
          ) : invoice ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <PaymentStatusBadge status={invoice.paymentStatus} />
                <p className="text-sm text-slate-500">Issued: {formatDate(invoice.issueDate)}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Customer</p>
                  <p className="mt-1 font-medium text-slate-900">{invoice.customer?.name}</p>
                  <p className="text-sm text-slate-600">{invoice.customer?.phone}</p>
                  {invoice.customer?.email && (
                    <p className="text-sm text-slate-600">{invoice.customer.email}</p>
                  )}
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Amounts</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Grand Total: <span className="font-semibold text-slate-900">{formatCurrency(invoice.grandTotal)}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Paid: {formatCurrency(invoice.amountPaid)}
                  </p>
                  <p className="text-sm text-slate-600">
                    Balance: {formatCurrency(invoice.balanceDue)}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Line Items</p>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-slate-500">Description</th>
                        <th className="px-4 py-2 text-right font-medium text-slate-500">Qty</th>
                        <th className="px-4 py-2 text-right font-medium text-slate-500">Price</th>
                        <th className="px-4 py-2 text-right font-medium text-slate-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoice.items?.map((item, index) => (
                        <tr key={item._id || index}>
                          <td className="px-4 py-2 text-slate-900">{item.description}</td>
                          <td className="px-4 py-2 text-right text-slate-600">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-slate-600">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-2 text-right font-medium text-slate-900">
                            {formatCurrency(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {invoice.publicViewUrl && (
                <a
                  href={invoice.publicViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Open public invoice link →
                </a>
              )}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">Invoice not found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewModal;
