import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  downloadInvoicePdf,
  getInvoiceById,
  getInvoices,
  resendInvoiceSms,
  updateInvoiceStatus,
} from '../api/invoiceApi.js';
import AdvancePaidModal from '../components/invoices/AdvancePaidModal.jsx';
import InvoiceViewModal from '../components/invoices/InvoiceViewModal.jsx';
import PaymentStatusBadge from '../components/invoices/PaymentStatusBadge.jsx';
import { formatCurrency, formatDate } from '../utils/invoiceCalculations.js';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceInvoice, setAdvanceInvoice] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [actionLoading, setActionLoading] = useState({});
  const [statusSelectKeys, setStatusSelectKeys] = useState({});

  const resetStatusSelect = (invoiceId) => {
    setStatusSelectKeys((prev) => ({
      ...prev,
      [invoiceId]: (prev[invoiceId] || 0) + 1,
    }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 4000);
  };

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getInvoices({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
      });
      setInvoices(response.data);
      setPagination({ total: response.total, pages: response.pages });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const setRowLoading = (id, key, value) => {
    setActionLoading((prev) => ({
      ...prev,
      [`${id}-${key}`]: value,
    }));
  };

  const handleView = async (invoice) => {
    setViewModalOpen(true);
    setViewLoading(true);
    setViewInvoice(null);
    try {
      const response = await getInvoiceById(invoice._id);
      setViewInvoice(response.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load invoice.');
      setViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleDownloadPdf = async (invoice) => {
    setRowLoading(invoice._id, 'pdf', true);
    try {
      await downloadInvoicePdf(invoice._id, invoice.invoiceNumber);
      showToast(`Downloaded ${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to download PDF.');
    } finally {
      setRowLoading(invoice._id, 'pdf', false);
    }
  };

  const handleResendSms = async (invoice) => {
    setRowLoading(invoice._id, 'sms', true);
    try {
      const response = await resendInvoiceSms(invoice._id);
      showToast(response.message || 'SMS resent successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resend SMS.');
    } finally {
      setRowLoading(invoice._id, 'sms', false);
    }
  };

  const handleStatusChange = async (invoice, paymentStatus) => {
    if (paymentStatus === 'Advance Paid') {
      setAdvanceInvoice(invoice);
      setAdvanceModalOpen(true);
      return;
    }

    if (paymentStatus === invoice.paymentStatus) return;

    const confirmed = window.confirm(
      `Change ${invoice.invoiceNumber} status to "${paymentStatus}"?`
    );
    if (!confirmed) return;

    setRowLoading(invoice._id, 'status', true);
    try {
      await updateInvoiceStatus(invoice._id, { paymentStatus });
      showToast(`Status updated to ${paymentStatus}.`);
      fetchInvoices();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setRowLoading(invoice._id, 'status', false);
    }
  };

  const handleAdvanceSubmit = async (amountPaid) => {
    if (!advanceInvoice) return;
    setStatusUpdating(true);
    try {
      await updateInvoiceStatus(advanceInvoice._id, {
        paymentStatus: 'Advance Paid',
        amountPaid,
      });
      showToast('Status updated to Advance Paid.');
      setAdvanceModalOpen(false);
      setAdvanceInvoice(null);
      fetchInvoices();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Invoice Management</h2>
          <p className="text-sm text-slate-500">
            {pagination.total} invoice{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link to="/invoices/new" className="btn-primary">
          + Create Invoice
        </Link>
      </div>

      {toast && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {toast}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="relative max-w-md">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              className="input-field pl-10"
              placeholder="Search by invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-slate-900">No invoices found</p>
            <p className="mt-1 text-sm text-slate-500">
              <Link to="/invoices/new" className="text-brand-600 hover:underline">
                Create your first invoice
              </Link>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Invoice No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Grand Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {invoice.customer?.name || '—'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(invoice.grandTotal)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <PaymentStatusBadge status={invoice.paymentStatus} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(invoice)}
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          title="View"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(invoice)}
                          disabled={actionLoading[`${invoice._id}-pdf`]}
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          title="Download PDF"
                        >
                          {actionLoading[`${invoice._id}-pdf`] ? '...' : 'PDF'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResendSms(invoice)}
                          disabled={actionLoading[`${invoice._id}-sms`]}
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          title="Resend SMS"
                        >
                          {actionLoading[`${invoice._id}-sms`] ? '...' : 'SMS'}
                        </button>
                        <select
                          key={`${invoice._id}-${statusSelectKeys[invoice._id] || 0}`}
                          defaultValue={invoice.paymentStatus}
                          onChange={(e) => handleStatusChange(invoice, e.target.value)}
                          disabled={actionLoading[`${invoice._id}-status`]}
                          className="rounded-lg border border-slate-300 py-1.5 pl-2 pr-7 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          title="Update status"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Advance Paid">Advance Paid</option>
                          <option value="Fully Paid">Fully Paid</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">
              Page {page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <InvoiceViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setViewInvoice(null);
        }}
        invoice={viewInvoice}
        loading={viewLoading}
      />

      <AdvancePaidModal
        isOpen={advanceModalOpen}
        onClose={() => {
          if (advanceInvoice) resetStatusSelect(advanceInvoice._id);
          setAdvanceModalOpen(false);
          setAdvanceInvoice(null);
        }}
        invoice={advanceInvoice}
        onSubmit={handleAdvanceSubmit}
        loading={statusUpdating}
      />
    </div>
  );
};

export default InvoicesPage;
