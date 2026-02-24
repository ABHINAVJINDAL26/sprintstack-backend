const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createSprint, getSprintsByProject, getSprintById,
  updateSprint, getSprintProgress
} = require('../controllers/sprintController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateRequest');

router.use(protect);

router.post('/', [
  body('projectId').notEmpty().withMessage('projectId is required'),
  body('name').trim().notEmpty().withMessage('Sprint name is required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
], validateRequest, createSprint);

router.get('/:id/progress', getSprintProgress);
router.get('/project/:projectId', getSprintsByProject);
router.get('/:projectId', getSprintsByProject);
router.get('/:id', getSprintById);

router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('status').optional().isIn(['planned', 'active', 'completed']),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
], validateRequest, updateSprint);

module.exports = router;
