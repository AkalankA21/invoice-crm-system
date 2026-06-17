import api from './client.js';

export const getDashboardStats = async () => {
  const { data } = await api.get('/dashboard/stats');
  return data;
};
