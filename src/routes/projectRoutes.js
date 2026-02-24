const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createProject, getAllProjects, getProjectById,
  updateProject, deleteProject, addTeamMember
} = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateRequest');
const { validateObjectId } = require('../middlewares/validateObjectId');

router.use(protect);

router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
], validateRequest, createProject);

router.get('/', getAllProjects);
router.get('/:id', validateObjectId('id'), getProjectById);

router.put('/:id', [
  body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
  body('status').optional().isIn(['active', 'archived']).withMessage('Invalid status'),
], validateObjectId('id'), validateRequest, updateProject);

router.delete('/:id', validateObjectId('id'), deleteProject);

router.post('/:id/members', [
  body('email').isEmail().withMessage('Valid email is required'),
], validateObjectId('id'), validateRequest, addTeamMember);

module.exports = router;
