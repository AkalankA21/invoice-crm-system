import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, CalendarDays, FileText, Receipt } from 'lucide-react';
import { getCustomers } from '../api/customerApi.js';
import { createInvoice } from '../api/invoiceApi.js';
import {
  calculateInvoiceTotals,
  calculateLineTotal,
  formatCurrency,
} from '../utils/invoiceCalculations.js';

const emptyItem = () => ({
  id: crypto.randomUUID(),
  description: '',
  quantity: 1,
  unitPrice: 0,
});

const CreateInvoicePage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await getCustomers({ limit: 100 });
        setCustomers(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load customers.');
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  const totals = useMemo(
    () => calculateInvoiceTotals(items, discountPercent, taxPercent),
    [items, discountPercent, taxPercent]
  );

  const selectedCustomer = customers.find((customer) => customer._id === customerId);

  const updateItem = (id, field, value) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (id) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    const validItems = items.filter((item) => item.description.trim());
    if (!validItems.length) {
      setError('Add at least one item with a description.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createInvoice({
        customerId,
        items: validItems.map(({ description, quantity, unitPrice }) => ({
          description: description.trim(),
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
        })),
        discount: { type: 'percentage', value: Number(discountPercent) || 0 },
        tax: { rate: Number(taxPercent) || 0 },
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
      });

      setSuccess(response.message || 'Invoice created successfully.');
      setTimeout(() => navigate('/invoices'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Billing</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Create Invoice</h2>
        </div>
        <Link to="/invoices" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="card rounded-3xl space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FileText className="h-4 w-4 text-blue-600" />
              Customer details
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="customer" className="mb-2 block text-sm font-medium text-slate-700">Customer</label>
                <select
                  id="customer"
                  required
                  className="input-field"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  disabled={loadingCustomers}
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>{customer.name} — {customer.phone}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dueDate" className="mb-2 block text-sm font-medium text-slate-700">Due Date</label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="dueDate"
                    type="date"
                    className="input-field pl-10"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {selectedCustomer && (
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">{selectedCustomer.name}</p>
                <p className="mt-1 text-sm text-slate-500">{selectedCustomer.email || 'No email provided'}</p>
                <p className="mt-1 text-sm text-slate-500">{selectedCustomer.phone}</p>
              </div>
            )}
          </div>

          <div className="card rounded-3xl p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Items</p>
                <h3 className="text-lg font-semibold text-slate-900">Line items</h3>
              </div>
              <button type="button" onClick={addItem} className="btn-primary">
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
                    <th className="w-24 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Qty</th>
                    <th className="w-36 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Price</th>
                    <th className="w-28 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Total</th>
                    <th className="w-14 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <input
                          className="input-field"
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="0.01" step="0.01" className="input-field" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" step="0.01" className="input-field" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)} />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{formatCurrency(calculateLineTotal(item.quantity, item.unitPrice))}</td>
                      <td className="px-4 py-3 text-center">
                        <button type="button" onClick={() => removeItem(item.id)} disabled={items.length === 1} className="text-slate-400 transition hover:text-red-600 disabled:opacity-30" aria-label="Remove item">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="card rounded-3xl space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Additional details</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="discount" className="mb-2 block text-sm font-medium text-slate-700">Discount (%)</label>
                <input id="discount" type="number" min="0" max="100" step="0.01" className="input-field" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
              </div>
              <div>
                <label htmlFor="tax" className="mb-2 block text-sm font-medium text-slate-700">Tax (%)</label>
                <input id="tax" type="number" min="0" max="100" step="0.01" className="input-field" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
              <textarea id="notes" rows={4} className="input-field" placeholder="Payment terms or special instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="card rounded-3xl bg-slate-900 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-100">
              <Receipt className="h-4 w-4" />
              Invoice summary
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-300">Subtotal</dt><dd>{formatCurrency(totals.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-300">Discount ({discountPercent || 0}%)</dt><dd className="text-red-300">- {formatCurrency(totals.discountAmount)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-300">Tax ({taxPercent || 0}%)</dt><dd>{formatCurrency(totals.taxAmount)}</dd></div>
              <div className="border-t border-slate-700 pt-3">
                <div className="flex justify-between text-base"><dt className="font-semibold">Grand Total</dt><dd className="text-xl font-bold text-blue-100">{formatCurrency(totals.grandTotal)}</dd></div>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="btn-primary min-w-[220px]">
            {submitting ? 'Generating...' : 'Generate & Send Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoicePage;
