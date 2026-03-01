const chatService = require('../services/chatService');
const fs = require('fs/promises');

async function cleanupUploadedFiles(files = []) {
  await Promise.all(
    files.map((file) => fs.unlink(file.path).catch(() => null))
  );
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
