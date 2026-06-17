import api from './client.js';

export const getCustomers = async (params = {}) => {
  const { data } = await api.get('/customers', { params });
  return data;
};

export const getCustomerById = async (id) => {
  const { data } = await api.get(`/customers/${id}`);
  return data;
};

export const createCustomer = async (payload) => {
  const { data } = await api.post('/customers', payload);
  return data;
};

export const updateCustomer = async (id, payload) => {
  const { data } = await api.put(`/customers/${id}`, payload);
  return data;
};

export const deleteCustomer = async (id) => {
  const { data } = await api.delete(`/customers/${id}`);
  return data;
};
