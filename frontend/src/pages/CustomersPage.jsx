import { useCallback, useEffect, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from '../api/customerApi.js';
import CustomerModal from '../components/customers/CustomerModal.jsx';
import CustomerTable from '../components/customers/CustomerTable.jsx';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getCustomers({
        search: debouncedSearch || undefined,
        page,
        limit: 10,
      });
      setCustomers(response.data);
      setPagination({ total: response.total, pages: response.pages });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openAddModal = () => {
    setSelectedCustomer(null);
    setModalOpen(true);
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError('');

    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer._id, payload);
      } else {
        await createCustomer(payload);
      }
      closeModal();
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (customer) => {
    const confirmed = window.confirm(`Delete customer "${customer.name}"? This cannot be undone.`);
    if (!confirmed) return;

    setError('');
    try {
      await deleteCustomer(customer._id);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete customer.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Contacts</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Customer Management</h2>
          <p className="mt-1 text-sm text-slate-500">
            {pagination.total} customer{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="card overflow-hidden rounded-3xl p-0">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input-field pl-10"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <CustomerTable
          customers={customers}
          loading={loading}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">Page {page} of {pagination.pages}</p>
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

      <CustomerModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        customer={selectedCustomer}
        loading={submitting}
      />
    </div>
  );
};

export default CustomersPage;
