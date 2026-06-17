import api from './client.js';

export const getInvoices = async (params = {}) => {
  const { data } = await api.get('/invoices', { params });
  return data;
};

export const getInvoiceById = async (id) => {
  const { data } = await api.get(`/invoices/${id}`);
  return data;
};

export const createInvoice = async (payload) => {
  const { data } = await api.post('/invoices', payload);
  return data;
};

export const updateInvoiceStatus = async (id, payload) => {
  const { data } = await api.patch(`/invoices/${id}/status`, payload);
  return data;
};

export const resendInvoiceSms = async (id) => {
  const { data } = await api.post(`/invoices/${id}/resend-sms`);
  return data;
};

export const downloadInvoicePdf = async (id, invoiceNumber) => {
  const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
