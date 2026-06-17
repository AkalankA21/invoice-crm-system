const statusStyles = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-100',
  'Advance Paid': 'bg-brand-50 text-brand-700 ring-brand-100',
  'Fully Paid': 'bg-emerald-50 text-emerald-700 ring-emerald-100',
};

const PaymentStatusBadge = ({ status }) => {
  const style = statusStyles[status] || 'bg-slate-50 text-slate-700 ring-slate-100';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {status}
    </span>
  );
};

export default PaymentStatusBadge;
