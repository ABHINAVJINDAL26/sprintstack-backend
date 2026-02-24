const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createTask, getTasks, getTaskById, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateRequest');
const { validateObjectId } = require('../middlewares/validateObjectId');

router.use(protect);

router.post('/', [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('projectId').notEmpty().withMessage('projectId is required').isMongoId().withMessage('projectId must be a valid Mongo ObjectId'),
  body('sprintId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('sprintId must be a valid Mongo ObjectId'),
  body('assignedTo').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('assignedTo must be a valid Mongo ObjectId'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['backlog', 'todo', 'in-progress', 'review', 'done']),
  body('storyPoints').optional().isNumeric().withMessage('Story points must be a number'),
], validateRequest, createTask);

// GET /api/tasks?projectId=&sprintId=&status=&priority=&page=&limit=
router.get('/', getTasks);
router.get('/:id', validateObjectId('id'), getTaskById);

router.put('/:id', [
  body('title').optional().trim().notEmpty(),
  body('sprintId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('sprintId must be a valid Mongo ObjectId'),
  body('assignedTo').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('assignedTo must be a valid Mongo ObjectId'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['backlog', 'todo', 'in-progress', 'review', 'done']),
  body('storyPoints').optional().isNumeric(),
], validateObjectId('id'), validateRequest, updateTask);

router.delete('/:id', validateObjectId('id'), deleteTask);

module.exports = router;
