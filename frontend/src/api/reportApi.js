import api from './client.js';

export const getReports = async (params = {}) => {
  const { data } = await api.get('/reports', { params });
  return data;
};
