import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CircleDollarSign,
  Clock3,
  FileText,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getDashboardStats } from '../api/dashboardApi.js';
import { getInvoices } from '../api/invoiceApi.js';
import PaymentStatusBadge from '../components/invoices/PaymentStatusBadge.jsx';
import { formatCurrency, formatDate } from '../utils/invoiceCalculations.js';

const chartData = [
  { month: 'Jan', revenue: 18000 },
  { month: 'Feb', revenue: 22000 },
  { month: 'Mar', revenue: 21000 },
  { month: 'Apr', revenue: 29000 },
  { month: 'May', revenue: 34000 },
  { month: 'Jun', revenue: 38000 },
];

const StatCard = ({ label, value, subtext, icon: Icon, tone }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="card rounded-3xl border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone] || tones.blue}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{subtext}</p>
    </div>
  );
};

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsRes, invoicesRes] = await Promise.all([
          getDashboardStats(),
          getInvoices({ page: 1, limit: 5 }),
        ]);
        setStats(statsRes.data);
        setRecentInvoices(invoicesRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const pendingAmount = stats?.byStatus?.Pending?.grandTotal ?? 0;
  const paidCount =
    (stats?.byStatus?.['Fully Paid']?.count ?? 0) + (stats?.byStatus?.['Advance Paid']?.count ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Performance</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Dashboard Overview</h2>
        </div>
        <Link to="/reports" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
          Open reports <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          subtext={`${paidCount} paid invoice(s)`}
          icon={CircleDollarSign}
          tone="blue"
        />
        <StatCard
          label="Invoices"
          value={stats?.totalInvoices ?? 0}
          subtext="Created this month"
          icon={FileText}
          tone="emerald"
        />
        <StatCard
          label="Pending"
          value={formatCurrency(pendingAmount)}
          subtext={`${stats?.byStatus?.Pending?.count ?? 0} awaiting payment`}
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Customers"
          value={stats?.totalCustomers ?? 0}
          subtext="Active accounts"
          icon={Users}
          tone="slate"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card rounded-3xl p-0">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Revenue</p>
              <h3 className="text-lg font-semibold text-slate-900">Monthly performance</h3>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              <TrendingUp className="h-4 w-4" />
              +18.4%
            </span>
          </div>
          <div className="h-80 p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#64748b" />
                <YAxis tickLine={false} axisLine={false} stroke="#64748b" />
                <Tooltip
                  cursor={{ stroke: '#bfdbfe', strokeDasharray: '4 4' }}
                  contentStyle={{
                    borderRadius: '16px',
                    borderColor: '#dbeafe',
                    boxShadow: '0 6px 18px rgba(15,23,42,0.08)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  fill="url(#revenueGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card rounded-3xl p-0">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">{invoice.customer?.name || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <PaymentStatusBadge status={invoice.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden rounded-3xl p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="font-semibold text-slate-900">Recent Invoices</h3>
            <p className="text-sm text-slate-500">Latest updates from your billing pipeline</p>
          </div>
          <Link to="/invoices" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View all →
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{invoice.invoiceNumber}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{invoice.customer?.name || '—'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{formatDate(invoice.issueDate)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">{formatCurrency(invoice.grandTotal)}</td>
                    <td className="whitespace-nowrap px-6 py-4"><PaymentStatusBadge status={invoice.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
