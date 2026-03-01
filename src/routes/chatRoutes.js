const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middlewares/authMiddleware');
const { validateObjectId } = require('../middlewares/validateObjectId');
const { validateRequest } = require('../middlewares/validateRequest');
const { uploadChatFiles } = require('../middlewares/uploadChatFiles');
const { getProjectMessages, createProjectMessage } = require('../controllers/chatController');

const router = express.Router();

router.use(protect);

router.get('/project/:projectId', validateObjectId('projectId'), getProjectMessages);

router.post(
  '/project/:projectId/messages',
  validateObjectId('projectId'),
  uploadChatFiles.array('attachments', 5),
  [
    body('message')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Message cannot exceed 1000 characters')
      .custom((_value, { req }) => {
        const hasText = Boolean(String(req.body?.message || '').trim());
        const hasFiles = Array.isArray(req.files) && req.files.length > 0;

        if (!hasText && !hasFiles) {
          throw new Error('Message or at least one attachment is required');
        }

        return true;
      }),
  ],
  validateRequest,
  createProjectMessage
);

module.exports = router;
