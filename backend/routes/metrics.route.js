import express from 'express';
import { updateMetrics } from '../controllers/metrics.controller.js';

const router = express.Router();

router.post('/:userId/update', updateMetrics);

export default router;