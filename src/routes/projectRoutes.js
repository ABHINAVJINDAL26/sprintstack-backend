const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createProject, getAllProjects, getProjectById,
  updateProject, deleteProject, addTeamMember
} = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateRequest');

router.use(protect);

router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
], validateRequest, createProject);

router.get('/', getAllProjects);
router.get('/:id', getProjectById);

router.put('/:id', [
  body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
  body('status').optional().isIn(['active', 'archived']).withMessage('Invalid status'),
], validateRequest, updateProject);

router.delete('/:id', deleteProject);

router.post('/:id/members', [
  body('email').isEmail().withMessage('Valid email is required'),
], validateRequest, addTeamMember);

module.exports = router;
