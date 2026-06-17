/**
 * Mock SMS gateway service simulating Sri Lankan providers (Notify.lk / Mobitel).
 * Replace sendSms with real HTTP calls when production credentials are available.
 */

const SMS_PROVIDER = process.env.SMS_PROVIDER || 'notify.lk';
const SMS_API_KEY = process.env.SMS_API_KEY || '';
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'InvoiceCRM';

const sentMessages = [];

export const normalizeSriLankanPhone = (phone) => {
  if (!phone) return null;

  let digits = String(phone).replace(/\D/g, '');

  if (digits.startsWith('94')) {
    return digits;
  }
  if (digits.startsWith('0')) {
    return `94${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `94${digits}`;
  }

  return digits;
};

const buildInvoiceSmsMessage = ({ customerName, invoiceNumber, publicUrl, grandTotal }) => {
  const amount = grandTotal != null ? ` Amount: LKR ${Number(grandTotal).toFixed(2)}.` : '';
  return `Dear ${customerName}, your invoice ${invoiceNumber} is ready.${amount} View & pay: ${publicUrl} - ${SMS_SENDER_ID}`;
};

const simulateGatewayRequest = async ({ phone, message }) => {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const messageId = `mock-${SMS_PROVIDER}-${Date.now()}`;

  const record = {
    messageId,
    provider: SMS_PROVIDER,
    phone,
    message,
    status: 'sent',
    sentAt: new Date().toISOString(),
  };

  sentMessages.push(record);

  console.log(`[SMS Mock - ${SMS_PROVIDER}]`);
  console.log(`  To: ${phone}`);
  console.log(`  Message: ${message}`);
  console.log(`  Message ID: ${messageId}`);

  return record;
};

/**
 * Production integration example (Notify.lk):
 *
 * const response = await fetch('https://app.notify.lk/api/v1/send', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     user_id: process.env.NOTIFY_USER_ID,
 *     api_key: SMS_API_KEY,
 *     sender_id: SMS_SENDER_ID,
 *     to: phone,
 *     message,
 *   }),
 * });
 */
export const sendSms = async ({ phone, message }) => {
  const normalizedPhone = normalizeSriLankanPhone(phone);

  if (!normalizedPhone || normalizedPhone.length < 11) {
    throw new Error(`Invalid Sri Lankan mobile number: ${phone}`);
  }

  if (!message?.trim()) {
    throw new Error('SMS message cannot be empty');
  }

  if (process.env.SMS_ENABLED === 'true' && SMS_API_KEY) {
    // Wire real provider HTTP call here when credentials are configured.
    console.warn('[SMS] SMS_ENABLED is true but only mock delivery is implemented.');
  }

  return simulateGatewayRequest({ phone: normalizedPhone, message: message.trim() });
};

export const sendInvoiceSms = async ({ phone, customerName, invoiceNumber, publicUrl, grandTotal }) => {
  const message = buildInvoiceSmsMessage({ customerName, invoiceNumber, publicUrl, grandTotal });
  return sendSms({ phone, message });
};

const buildPaymentStatusSmsMessage = ({
  customerName,
  invoiceNumber,
  paymentStatus,
  amountPaid,
  balanceDue,
  publicUrl,
}) => {
  return `Dear ${customerName}, payment update for invoice ${invoiceNumber}: Status is now ${paymentStatus}. Paid: LKR ${Number(amountPaid).toFixed(2)}. Balance: LKR ${Number(balanceDue).toFixed(2)}. View: ${publicUrl} - ${SMS_SENDER_ID}`;
};

export const sendPaymentStatusSms = async ({
  phone,
  customerName,
  invoiceNumber,
  paymentStatus,
  amountPaid,
  balanceDue,
  publicUrl,
}) => {
  const message = buildPaymentStatusSmsMessage({
    customerName,
    invoiceNumber,
    paymentStatus,
    amountPaid,
    balanceDue,
    publicUrl,
  });
  return sendSms({ phone, message });
};

export const getMockSmsLog = () => [...sentMessages];
