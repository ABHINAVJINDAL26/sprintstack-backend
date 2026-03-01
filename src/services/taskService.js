const Task = require('../models/taskModel');
const Project = require('../models/projectModel');
const Sprint = require('../models/sprintModel');
const AppError = require('../utils/appError');

const STATUS_TRANSITIONS = {
  backlog: ['todo'],
  todo: ['in-progress', 'backlog'],
  'in-progress': ['review', 'todo'],
  review: ['done', 'in-progress'],
  done: ['review'],
};

async function verifyMembership(projectId, userId, userRole) {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);
  const isMember = project.teamMembers.some((m) => m.toString() === userId.toString());
  if (userRole !== 'admin' && !isMember)
    throw new AppError('You are not a member of this project', 403);
  return project;
}

async function createTask(data, userId, userRole) {
  await verifyMembership(data.projectId, userId, userRole);
  if (userRole !== 'admin' && userRole !== 'manager')
    throw new AppError('Only admin or manager can create tasks', 403);

  if (data.sprintId) {
    const sprint = await Sprint.findById(data.sprintId);
    if (!sprint) throw new AppError('Sprint not found', 404);
    if (sprint.projectId.toString() !== data.projectId.toString())
      throw new AppError('Sprint does not belong to this project', 400);
  }

  return await Task.create({ ...data, createdBy: userId });
}

async function getTasks(filters, userId, userRole) {
  const { projectId, sprintId, status, assignedTo, priority, page = 1, limit = 20 } = filters;
  const query = {};
  if (projectId) {
    await verifyMembership(projectId, userId, userRole);
    query.projectId = projectId;
  } else if (userRole !== 'admin') {
    const memberProjects = await Project.find({ teamMembers: userId }).select('_id');
    query.projectId = { $in: memberProjects.map((project) => project._id) };
  }

  if (sprintId) query.sprintId = sprintId;
  if (status) query.status = status;
  if (assignedTo) query.assignedTo = assignedTo;
  if (priority) query.priority = priority;

  const skip = (Number(page) - 1) * Number(limit);
  const [tasks, total] = await Promise.all([
    Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('sprintId', 'name status')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Task.countDocuments(query),
  ]);

  return { tasks, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
}

async function getTaskById(taskId, userId, userRole) {
  const task = await Task.findById(taskId)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('sprintId', 'name status')
    .populate('projectId', 'name');
  if (!task) throw new AppError('Task not found', 404);
  await verifyMembership(task.projectId._id, userId, userRole);
  return task;
}

async function updateTask(taskId, data, userId, userRole) {
  const task = await Task.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);
  await verifyMembership(task.projectId, userId, userRole);

  // Developers can only update their own tasks' status
  if (userRole === 'developer') {
    if (task.assignedTo?.toString() !== userId.toString())
      throw new AppError('Developers can only update their own assigned tasks', 403);
    Object.keys(data).forEach((k) => { if (k !== 'status') delete data[k]; });
    if (data.status === 'done') {
      throw new AppError('Developers cannot move tasks to done. Send to review for QA.', 403);
    }
  }

  // QA can only change status
  if (userRole === 'qa') {
    Object.keys(data).forEach((k) => { if (k !== 'status') delete data[k]; });
    if (data.status && !['review', 'in-progress', 'done'].includes(data.status))
      throw new AppError('QA can only set status to review, in-progress, or done', 403);
  }

  // Validate status transition
  if (data.status && data.status !== task.status) {
    const allowed = STATUS_TRANSITIONS[task.status] || [];
    if (!allowed.includes(data.status))
      throw new AppError(
        `Invalid status transition: '${task.status}' → '${data.status}'. Allowed: ${allowed.join(', ')}`,
        400
      );
  }

  return await Task.findByIdAndUpdate(taskId, data, { new: true, runValidators: true })
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');
}

async function deleteTask(taskId, userId, userRole) {
  const task = await Task.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);
  await verifyMembership(task.projectId, userId, userRole);
  if (userRole !== 'admin' && userRole !== 'manager')
    throw new AppError('Only admin or manager can delete tasks', 403);
  await task.deleteOne();
}

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };
