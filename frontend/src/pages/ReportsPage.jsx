import { useCallback, useEffect, useState } from 'react';
import { Download, Filter, RotateCcw } from 'lucide-react';
import { getCustomers } from '../api/customerApi.js';
import { getReports } from '../api/reportApi.js';
import PaymentStatusBadge from '../components/invoices/PaymentStatusBadge.jsx';
import { formatCurrency, formatDate } from '../utils/invoiceCalculations.js';

const PAYMENT_STATUSES = ['', 'Pending', 'Advance Paid', 'Fully Paid'];

const ReportsPage = () => {
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    customerId: '',
    paymentStatus: '',
  });
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await getCustomers({ limit: 100 });
        setCustomers(response.data);
      } catch {
        /* non-blocking */
      }
    };
    loadCustomers();
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 20,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.customerId && { customerId: filters.customerId }),
        ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
      };
      const response = await getReports(params);
      setReportData(response.data);
      setSummary(response.summary);
      setPagination({ total: response.total, pages: response.pages });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters({ startDate: '', endDate: '', customerId: '', paymentStatus: '' });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Analytics</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Revenue Reports</h2>
        </div>
        <button type="button" className="btn-primary">
          <Download className="h-4 w-4" />
          Download
        </button>
      </div>

      <div className="card rounded-3xl">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Filter className="h-4 w-4 text-blue-600" />
          Filters
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="startDate" className="mb-2 block text-sm font-medium text-slate-700">Start Date</label>
            <input id="startDate" name="startDate" type="date" className="input-field" value={filters.startDate} onChange={handleFilterChange} />
          </div>
          <div>
            <label htmlFor="endDate" className="mb-2 block text-sm font-medium text-slate-700">End Date</label>
            <input id="endDate" name="endDate" type="date" className="input-field" value={filters.endDate} onChange={handleFilterChange} />
          </div>
          <div>
            <label htmlFor="customerId" className="mb-2 block text-sm font-medium text-slate-700">Customer</label>
            <select id="customerId" name="customerId" className="input-field" value={filters.customerId} onChange={handleFilterChange}>
              <option value="">All customers</option>
              {customers.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="paymentStatus" className="mb-2 block text-sm font-medium text-slate-700">Payment Status</label>
            <select id="paymentStatus" name="paymentStatus" className="input-field" value={filters.paymentStatus} onChange={handleFilterChange}>
              {PAYMENT_STATUSES.map((status) => (<option key={status || 'all'} value={status}>{status || 'All statuses'}</option>))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={handleReset} className="btn-secondary">
            <RotateCcw className="h-4 w-4" />
            Reset Filters
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="card rounded-3xl p-4">
            <p className="text-sm text-slate-500">Invoices</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.invoiceCount}</p>
          </div>
          <div className="card rounded-3xl p-4">
            <p className="text-sm text-slate-500">Revenue Collected</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">{formatCurrency(summary.totalRevenue)}</p>
          </div>
          <div className="card rounded-3xl p-4">
            <p className="text-sm text-slate-500">Total Invoiced</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalGrandTotal)}</p>
          </div>
          <div className="card rounded-3xl p-4">
            <p className="text-sm text-slate-500">Outstanding</p>
            <p className="mt-1 text-2xl font-semibold text-amber-600">{formatCurrency(summary.totalOutstanding)}</p>
          </div>
        </div>
      )}

      {error && (<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>)}

      <div className="card overflow-hidden rounded-3xl p-0">
        {loading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500" /></div>
        ) : reportData.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No invoices match the selected filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Grand Total</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Paid</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {reportData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">{row.invoiceNumber}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{row.customer?.name || '—'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{formatDate(row.issueDate)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(row.grandTotal)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-emerald-600">{formatCurrency(row.amountPaid)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-amber-600">{formatCurrency(row.balanceDue)}</td>
                    <td className="whitespace-nowrap px-6 py-4"><PaymentStatusBadge status={row.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 bg-slate-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-slate-900">Filtered Totals ({summary?.invoiceCount ?? 0} invoices)</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{formatCurrency(summary?.totalGrandTotal ?? 0)}</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-emerald-700">{formatCurrency(summary?.totalRevenue ?? 0)}</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-amber-700">{formatCurrency(summary?.totalOutstanding ?? 0)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">Page {page} of {pagination.pages} ({pagination.total} results)</p>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-50">Previous</button>
              <button type="button" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn-secondary disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
