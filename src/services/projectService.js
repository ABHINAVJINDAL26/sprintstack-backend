const Project = require('../models/projectModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');

async function createProject(data, userId) {
  const project = await Project.create({ ...data, createdBy: userId, teamMembers: [userId] });
  return project;
}

async function getAllProjects(userId, userRole) {
  const query = userRole === 'admin' ? {} : { teamMembers: userId };
  return await Project.find(query)
    .populate('createdBy', 'name email')
    .populate('teamMembers', 'name email role')
    .sort('-createdAt');
}

async function getProjectById(projectId, userId, userRole) {
  const project = await Project.findById(projectId)
    .populate('createdBy', 'name email')
    .populate('teamMembers', 'name email role');

  if (!project) throw new AppError('Project not found', 404);

  const isMember = project.teamMembers.some((m) => m._id.toString() === userId.toString());
  if (userRole !== 'admin' && !isMember) throw new AppError('You are not a member of this project', 403);

  return project;
}

async function updateProject(projectId, data, userId, userRole) {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  const isOwner = project.createdBy.toString() === userId.toString();
  if (userRole !== 'admin' && !isOwner)
    throw new AppError('Only the project creator or admin can update this project', 403);

  return await Project.findByIdAndUpdate(projectId, data, { new: true, runValidators: true })
    .populate('createdBy', 'name email')
    .populate('teamMembers', 'name email role');
}

async function deleteProject(projectId, userId, userRole) {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  const isOwner = project.createdBy.toString() === userId.toString();
  if (userRole !== 'admin' && !isOwner)
    throw new AppError('Only the project creator or admin can delete this project', 403);

  await project.deleteOne();
}

async function addTeamMember(projectId, memberEmail, userId, userRole) {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  const isOwner = project.createdBy.toString() === userId.toString();
  if (userRole !== 'admin' && userRole !== 'manager' && !isOwner)
    throw new AppError('Not authorized to add team members', 403);

  const member = await User.findOne({ email: memberEmail });
  if (!member) throw new AppError('User with this email not found', 404);

  if (project.teamMembers.includes(member._id))
    throw new AppError('User is already a team member', 400);

  project.teamMembers.push(member._id);
  await project.save();

  return await Project.findById(projectId)
    .populate('createdBy', 'name email')
    .populate('teamMembers', 'name email role');
}

module.exports = { createProject, getAllProjects, getProjectById, updateProject, deleteProject, addTeamMember };
