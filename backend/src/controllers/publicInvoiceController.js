import { Invoice } from '../models/index.js';
import { generateInvoicePdf } from '../services/pdfInvoiceService.js';
import { verifyPublicToken } from '../services/invoiceService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPublicInvoiceUrl } from '../utils/publicInvoiceUrl.js';
import { sanitizeInvoiceForPublic, invoiceIncludes } from '../utils/invoiceHelpers.js';
import { formatInvoiceForApi } from '../utils/formatters.js';
import { companyConfig } from '../config/company.js';

const loadInvoiceBySecureToken = async (secureToken) => {
  if (!secureToken?.trim()) {
    throw new AppError('Invalid invoice link', 400);
  }

  const invoice = await Invoice.unscoped().findOne({
    where: { publicViewToken: secureToken.trim() },
    include: invoiceIncludes,
  });

  if (!invoice) {
    throw new AppError('Invoice not found or link has expired', 404);
  }

  if (!verifyPublicToken(secureToken.trim(), invoice.publicViewHash)) {
    throw new AppError('Invalid or tampered invoice link', 403);
  }

  return invoice;
};

export const getPublicInvoice = asyncHandler(async (req, res) => {
  const invoice = await loadInvoiceBySecureToken(req.params.secureToken);

  res.status(200).json({
    success: true,
    data: {
      ...sanitizeInvoiceForPublic(invoice),
      company: {
        name: companyConfig.name,
        phone: companyConfig.phone,
        email: companyConfig.email,
        website: companyConfig.website,
      },
      publicViewUrl: buildPublicInvoiceUrl(invoice.publicViewToken),
      pdfDownloadUrl: `/api/public/invoices/${invoice.publicViewToken}/pdf`,
    },
  });
});

export const downloadPublicInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await loadInvoiceBySecureToken(req.params.secureToken);
  const formatted = formatInvoiceForApi(invoice);

  if (!formatted.customer) {
    throw new AppError('Customer details not found for this invoice', 404);
  }

  const pdfBuffer = await generateInvoicePdf(formatted, formatted.customer);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.send(pdfBuffer);
});
