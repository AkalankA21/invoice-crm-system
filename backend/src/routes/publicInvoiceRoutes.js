import express from 'express';
import {
  downloadPublicInvoicePdf,
  getPublicInvoice,
} from '../controllers/publicInvoiceController.js';

const router = express.Router();

router.get('/:secureToken/pdf', downloadPublicInvoicePdf);
router.get('/:secureToken', getPublicInvoice);

export default router;
