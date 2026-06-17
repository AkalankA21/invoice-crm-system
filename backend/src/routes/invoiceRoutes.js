import express from 'express';
import {
  createInvoice,
  downloadInvoicePdf,
  getInvoiceById,
  getInvoices,
  resendInvoiceSms,
  updateInvoiceStatus,
} from '../controllers/invoiceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getInvoices).post(createInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.post('/:id/resend-sms', resendInvoiceSms);
router.get('/:id/pdf', downloadInvoicePdf);
router.get('/:id', getInvoiceById);

export default router;
