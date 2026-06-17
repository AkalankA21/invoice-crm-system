import { useEffect, useState } from 'react';
import { formatCurrency } from '../../utils/invoiceCalculations.js';

const AdvancePaidModal = ({ isOpen, onClose, onSubmit, invoice, loading }) => {
  const [amountPaid, setAmountPaid] = useState('');

  useEffect(() => {
    if (isOpen && invoice) {
      const defaultAmount =
        invoice.amountPaid > 0 && invoice.amountPaid < invoice.grandTotal
          ? invoice.amountPaid
          : Math.round(invoice.grandTotal * 0.5 * 100) / 100;
      setAmountPaid(String(defaultAmount));
    }
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(Number(amountPaid));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Set Advance Payment</h2>
        <p className="mt-1 text-sm text-slate-500">
          Invoice {invoice.invoiceNumber} — Grand Total: {formatCurrency(invoice.grandTotal)}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="amountPaid" className="mb-1.5 block text-sm font-medium text-slate-700">
              Amount Paid (LKR)
            </label>
            <input
              id="amountPaid"
              type="number"
              min="0.01"
              step="0.01"
              max={invoice.grandTotal - 0.01}
              required
              className="input-field"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Must be greater than 0 and less than {formatCurrency(invoice.grandTotal)}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdvancePaidModal;
