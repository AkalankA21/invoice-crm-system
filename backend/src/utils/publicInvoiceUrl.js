export const buildPublicInvoiceUrl = (secureToken) => {
  const baseUrl = (process.env.PUBLIC_APP_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(
    /\/$/,
    ''
  );
  return `${baseUrl}/public/invoice/${secureToken}`;
};
