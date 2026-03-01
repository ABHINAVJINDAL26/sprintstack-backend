const chatService = require('../services/chatService');
const fs = require('fs/promises');
const { cloudinary } = require('../config/cloudinary');

async function cleanupUploadedFiles(files = []) {
  await Promise.all(files.map(async (file) => {
    const pathValue = file.path || '';

    if (typeof pathValue === 'string' && pathValue.startsWith('http')) {
      const publicId = file.filename;
      if (!publicId) return;

      const resourceTypes = ['image', 'video', 'raw'];
      for (const resourceType of resourceTypes) {
        try {
          const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            invalidate: true,
          });

          if (result?.result === 'ok' || result?.result === 'not found') {
            break;
          }
        } catch {
          // continue trying other resource types
        }
      }

      return;
    }

    if (pathValue) {
      await fs.unlink(pathValue).catch(() => null);
    }
  }));
}

async function getProjectMessages(req, res, next) {
  try {
    const messages = await chatService.getProjectMessages(
      req.params.projectId,
      req.user._id,
      req.user.role,
      req.query.limit
    );

    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    next(error);
  }
}

async function createProjectMessage(req, res, next) {
  try {
    const message = await chatService.createProjectMessage(
      req.params.projectId,
      req.body.message,
      req.user._id,
      req.user.role,
      req.files || []
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.params.projectId}`).emit('project_message:new', {
        message,
      });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    if (req.files?.length) {
      await cleanupUploadedFiles(req.files);
    }
    next(error);
  }
}

module.exports = {
  getProjectMessages,
  createProjectMessage,
};
