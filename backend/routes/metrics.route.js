import express from 'express';
import { 
  updateMetrics, 
  getStudentMetrics, 
  getStudentProgressReport, 
  getClassAverageMetrics, 
  compareStudentWithClass 
} from '../controllers/metrics.controller.js';

const router = express.Router();

// Update student metrics
router.post('/:userId/update', updateMetrics);

// Get student metrics
router.get('/:userId', getStudentMetrics);

// Get comprehensive student progress report
router.get('/:userId/report', getStudentProgressReport);

// Get class average metrics for comparison
router.get('/class/:classId/average', getClassAverageMetrics);

// Compare student with class average
router.get('/:userId/compare', compareStudentWithClass);

export default router;