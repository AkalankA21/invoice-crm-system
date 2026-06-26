export const companyConfig = {
  name: process.env.COMPANY_NAME || 'Startup Pvt Ltd',
  address: process.env.COMPANY_ADDRESS || 'lakeside street, nawinna, Maharagama.',
  phone: process.env.COMPANY_PHONE || '011 3330001',
  email: process.env.COMPANY_EMAIL || 'Startup@contacts.lk',
  website: process.env.COMPANY_WEBSITE || 'https://Startup.lk',
  logoPath: process.env.COMPANY_LOGO_PATH || '',
  paymentInstructions:
    process.env.PAYMENT_INSTRUCTIONS ||
    'Please transfer the total amount to our bank account within the due date. Include the invoice number as the payment reference. For queries, contact our billing department.',
  bankDetails: {
    bankName: process.env.COMPANY_BANK_NAME || 'Commercial Bank of Ceylon',
    accountName: process.env.COMPANY_ACCOUNT_NAME || 'Startup Pvt Ltd',
    accountNumber: process.env.COMPANY_ACCOUNT_NUMBER || '1234567890',
    branch: process.env.COMPANY_BANK_BRANCH || 'Colombo Main',
  },
};
