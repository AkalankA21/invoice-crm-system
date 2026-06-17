import PDFDocument from 'pdfkit';
import fs from 'fs';
import { companyConfig } from '../config/company.js';

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const drawLogo = (doc, x, y) => {
  const logoWidth = 100;
  const logoHeight = 60;

  if (companyConfig.logoPath && fs.existsSync(companyConfig.logoPath)) {
    doc.image(companyConfig.logoPath, x, y, { width: logoWidth, height: logoHeight, fit: [logoWidth, logoHeight] });
    return logoHeight + 10;
  }

  doc
    .rect(x, y, logoWidth, logoHeight)
    .lineWidth(1)
    .strokeColor('#cccccc')
    .stroke();

  doc
    .fontSize(10)
    .fillColor('#999999')
    .text('COMPANY LOGO', x, y + logoHeight / 2 - 5, { width: logoWidth, align: 'center' });

  doc.fillColor('#000000');
  return logoHeight + 10;
};

const drawItemsTable = (doc, invoice, startY) => {
  const tableTop = startY;
  const colX = { desc: 50, qty: 320, unit: 380, total: 470 };
  const rowHeight = 22;

  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Description', colX.desc, tableTop);
  doc.text('Qty', colX.qty, tableTop);
  doc.text('Unit Price', colX.unit, tableTop);
  doc.text('Line Total', colX.total, tableTop);

  doc
    .moveTo(50, tableTop + 14)
    .lineTo(545, tableTop + 14)
    .strokeColor('#dddddd')
    .stroke();

  let y = tableTop + 22;
  doc.font('Helvetica').fontSize(10);

  invoice.items.forEach((item) => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    doc.text(item.description, colX.desc, y, { width: 260 });
    doc.text(String(item.quantity), colX.qty, y);
    doc.text(formatCurrency(item.unitPrice), colX.unit, y);
    doc.text(formatCurrency(item.lineTotal), colX.total, y);
    y += rowHeight;
  });

  return y + 10;
};

const drawTotals = (doc, invoice, startY) => {
  const labelX = 360;
  const valueX = 470;
  let y = startY;

  const rows = [
    ['Subtotal', formatCurrency(invoice.subtotal)],
    [
      invoice.discount?.value > 0
        ? `Discount (${invoice.discount.type === 'percentage' ? `${invoice.discount.value}%` : 'Fixed'})`
        : 'Discount',
      `- ${formatCurrency(invoice.discount?.amount || 0)}`,
    ],
    [
      invoice.tax?.rate > 0 ? `Tax (${invoice.tax.rate}%)` : 'Tax',
      formatCurrency(invoice.tax?.amount || 0),
    ],
    ['Grand Total', formatCurrency(invoice.grandTotal)],
    ['Amount Paid', formatCurrency(invoice.amountPaid)],
    [
      'Balance Due',
      formatCurrency(Math.max(0, invoice.grandTotal - (invoice.amountPaid || 0))),
    ],
  ];

  doc.font('Helvetica').fontSize(10);

  rows.forEach(([label, value], index) => {
    const isGrandTotal = index === 3;
    if (isGrandTotal) doc.font('Helvetica-Bold');
    doc.text(label, labelX, y);
    doc.text(value, valueX, y, { align: 'right', width: 75 });
    if (isGrandTotal) doc.font('Helvetica');
    y += 18;
  });

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(invoice.paymentStatus === 'Fully Paid' ? '#22863a' : '#b08800')
    .text(`Payment Status: ${invoice.paymentStatus}`, labelX, y + 6);

  doc.fillColor('#000000');
  return y + 30;
};

const formatCustomerAddress = (customer) => {
  if (!customer?.address) return '';
  const { street, city, state, postalCode, country } = customer.address;
  return [street, city, state, postalCode, country].filter(Boolean).join(', ');
};

export const generateInvoicePdf = (invoice, customer) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const logoBottom = drawLogo(doc, 50, 45);

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('#1a1a1a')
      .text('INVOICE', 400, 45, { align: 'right', width: 145 });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#333333')
      .text(companyConfig.name, 50, 45 + logoBottom)
      .text(companyConfig.address, 50, doc.y + 2, { width: 250 })
      .text(`Phone: ${companyConfig.phone}`, 50, doc.y + 2)
      .text(`Email: ${companyConfig.email}`, 50, doc.y + 2);

    if (companyConfig.website) {
      doc.text(`Web: ${companyConfig.website}`, 50, doc.y + 2);
    }

    const metaY = 45 + logoBottom;
    doc
      .font('Helvetica')
      .fontSize(10)
      .text(`Invoice No: ${invoice.invoiceNumber}`, 350, metaY, { align: 'right', width: 195 })
      .text(`Issue Date: ${formatDate(invoice.issueDate)}`, 350, doc.y + 2, { align: 'right', width: 195 })
      .text(`Due Date: ${formatDate(invoice.dueDate)}`, 350, doc.y + 2, { align: 'right', width: 195 });

    doc.moveDown(2);

    const billToY = Math.max(doc.y, 160) + 10;
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('Bill To', 50, billToY);

    doc
      .font('Helvetica')
      .fontSize(10)
      .text(customer.name, 50, billToY + 16);

    if (customer.company) doc.text(customer.company, 50, doc.y + 2);
    if (customer.phone) doc.text(`Phone: ${customer.phone}`, 50, doc.y + 2);
    if (customer.email) doc.text(`Email: ${customer.email}`, 50, doc.y + 2);

    const addressLine = formatCustomerAddress(customer);
    if (addressLine) doc.text(addressLine, 50, doc.y + 2, { width: 250 });

    const tableStartY = doc.y + 25;
    const totalsStartY = drawItemsTable(doc, invoice, tableStartY);
    drawTotals(doc, invoice, totalsStartY);

    if (invoice.notes) {
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('Notes', 50, doc.y + 10)
        .font('Helvetica')
        .text(invoice.notes, 50, doc.y + 4, { width: 495 });
    }

    const paymentY = doc.y + 20;
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('Payment Instructions', 50, paymentY)
      .font('Helvetica')
      .fontSize(9)
      .text(companyConfig.paymentInstructions, 50, doc.y + 6, { width: 495 });

    const { bankName, accountName, accountNumber, branch } = companyConfig.bankDetails;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Bank Details', 50, doc.y + 12)
      .font('Helvetica')
      .fontSize(9)
      .text(`Bank: ${bankName}`, 50, doc.y + 4)
      .text(`Account Name: ${accountName}`, 50, doc.y + 2)
      .text(`Account No: ${accountNumber}`, 50, doc.y + 2)
      .text(`Branch: ${branch}`, 50, doc.y + 2);

    const footerY = 760;
    doc
      .fontSize(8)
      .fillColor('#888888')
      .text('Thank you for your business.', 50, footerY, { align: 'center', width: 495 });

    doc.end();
  });
};
