const Sprint = require('../models/sprintModel');
const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const AppError = require('../utils/appError');

async function verifyMembership(projectId, userId, userRole) {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);
  const isMember = project.teamMembers.some((m) => m.toString() === userId.toString());
  if (userRole !== 'admin' && !isMember)
    throw new AppError('You are not a member of this project', 403);
  return project;
}

async function createSprint(data, userId, userRole) {
  await verifyMembership(data.projectId, userId, userRole);
  if (userRole !== 'admin' && userRole !== 'manager')
    throw new AppError('Only admin or manager can create sprints', 403);
  return await Sprint.create(data);
}

async function getSprintsByProject(projectId, userId, userRole) {
  await verifyMembership(projectId, userId, userRole);
  return await Sprint.find({ projectId }).sort('-createdAt');
}

async function getSprintById(sprintId, userId, userRole) {
  const sprint = await Sprint.findById(sprintId).populate('projectId', 'name');
  if (!sprint) throw new AppError('Sprint not found', 404);
  await verifyMembership(sprint.projectId._id, userId, userRole);
  return sprint;
}

async function updateSprint(sprintId, data, userId, userRole) {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) throw new AppError('Sprint not found', 404);
  if (sprint.status === 'completed')
    throw new AppError('Cannot modify a completed sprint', 400);
  if (userRole !== 'admin' && userRole !== 'manager')
    throw new AppError('Only admin or manager can update sprints', 403);
  await verifyMembership(sprint.projectId, userId, userRole);
  return await Sprint.findByIdAndUpdate(sprintId, data, { new: true, runValidators: true });
}

async function getSprintProgress(sprintId, userId, userRole) {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) throw new AppError('Sprint not found', 404);
  await verifyMembership(sprint.projectId, userId, userRole);

  const tasks = await Task.find({ sprintId });
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const totalPoints = tasks.reduce((a, t) => a + (t.storyPoints || 0), 0);
  const completedPoints = tasks
    .filter((t) => t.status === 'done')
    .reduce((a, t) => a + (t.storyPoints || 0), 0);

  return {
    sprint,
    totalTasks: total,
    completedTasks: done,
    progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
    totalStoryPoints: totalPoints,
    completedStoryPoints: completedPoints,
    tasksByStatus: {
      backlog: tasks.filter((t) => t.status === 'backlog').length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
      review: tasks.filter((t) => t.status === 'review').length,
      done,
    },
  };
}

module.exports = { createSprint, getSprintsByProject, getSprintById, updateSprint, getSprintProgress };
