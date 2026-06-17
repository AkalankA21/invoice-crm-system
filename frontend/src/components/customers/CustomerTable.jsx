const formatAddress = (address) => {
  if (!address) return '—';
  const parts = [address.street, address.city, address.state, address.postalCode, address.country].filter(
    Boolean
  );
  return parts.length ? parts.join(', ') : '—';
};

const CustomerTable = ({ customers, onEdit, onDelete, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500" />
      </div>
    );
  }

  if (!customers.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium text-slate-900">No customers found</p>
        <p className="mt-1 text-sm text-slate-500">Add a customer or try a different search.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
            <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 md:table-cell">Address</th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {customers.map((customer) => (
            <tr key={customer._id} className="transition hover:bg-slate-50/80">
              <td className="whitespace-nowrap px-6 py-4">
                <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{customer.phone}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{customer.email || '—'}</td>
              <td className="hidden max-w-xs truncate px-6 py-4 text-sm text-slate-600 md:table-cell">{formatAddress(customer.address)}</td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(customer)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => onDelete(customer)} className="btn-danger">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;
