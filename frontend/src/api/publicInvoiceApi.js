import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const publicApi = axios.create({ baseURL: API_URL });

export const getPublicInvoice = async (secureToken) => {
  const { data } = await publicApi.get(`/public/invoices/${secureToken}`);
  return data;
};

export const downloadPublicInvoicePdf = async (secureToken, invoiceNumber) => {
  const response = await publicApi.get(`/public/invoices/${secureToken}/pdf`, {
    responseType: 'blob',
  });
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
