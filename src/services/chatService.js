const Project = require('../models/projectModel');
const ChatMessage = require('../models/chatMessageModel');
const AppError = require('../utils/appError');

function getAttachmentKind(mimeType = '') {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
  return 'file';
}

function mapUploadedFilesToAttachments(files = []) {
  return files.map((file) => ({
    originalName: file.originalname,
    fileName: file.filename || file.public_id || file.original_filename,
    mimeType: file.mimetype,
    size: file.size,
    url: file.path || file.secure_url,
    kind: getAttachmentKind(file.mimetype),
  }));
}

async function verifyMembership(projectId, userId, userRole) {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  const isMember = project.teamMembers.some((member) => member.toString() === userId.toString());
  if (userRole !== 'admin' && !isMember) {
    throw new AppError('You are not a member of this project', 403);
  }

  return project;
}

async function getProjectMessages(projectId, userId, userRole, limit = 100) {
  await verifyMembership(projectId, userId, userRole);

  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);

  return ChatMessage.find({ projectId })
    .populate('senderId', 'name email role')
    .sort('-createdAt')
    .limit(safeLimit)
    .then((messages) => messages.reverse());
}

async function createProjectMessage(projectId, message, userId, userRole, files = []) {
  await verifyMembership(projectId, userId, userRole);

  const content = String(message || '').trim();
  const attachments = mapUploadedFilesToAttachments(files);

  if (!content && attachments.length === 0) {
    throw new AppError('Message cannot be empty', 400);
  }

  const created = await ChatMessage.create({
    projectId,
    senderId: userId,
    message: content,
    attachments,
  });

  return created.populate('senderId', 'name email role');
}

module.exports = {
  getProjectMessages,
  createProjectMessage,
  mapUploadedFilesToAttachments,
};
