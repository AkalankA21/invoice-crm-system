export const companyConfig = {
  name: process.env.COMPANY_NAME || 'Your Company Name',
  address: process.env.COMPANY_ADDRESS || '123 Business Street, Colombo, Sri Lanka',
  phone: process.env.COMPANY_PHONE || '+94 11 234 5678',
  email: process.env.COMPANY_EMAIL || 'billing@yourcompany.lk',
  website: process.env.COMPANY_WEBSITE || 'https://yourcompany.lk',
  logoPath: process.env.COMPANY_LOGO_PATH || '',
  paymentInstructions:
    process.env.PAYMENT_INSTRUCTIONS ||
    'Please transfer the total amount to our bank account within the due date. Include the invoice number as the payment reference. For queries, contact our billing department.',
  bankDetails: {
    bankName: process.env.COMPANY_BANK_NAME || 'Commercial Bank of Ceylon',
    accountName: process.env.COMPANY_ACCOUNT_NAME || 'Your Company Name',
    accountNumber: process.env.COMPANY_ACCOUNT_NUMBER || '1234567890',
    branch: process.env.COMPANY_BANK_BRANCH || 'Colombo Main',
  },
};
