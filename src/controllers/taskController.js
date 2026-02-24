const taskService = require('../services/taskService');

async function createTask(req, res, next) {
  try {
    const task = await taskService.createTask(req.body, req.user._id, req.user.role);
    res.status(201).json({ success: true, task });
  } catch (err) { next(err); }
}

async function getTasks(req, res, next) {
  try {
    const result = await taskService.getTasks(req.query, req.user._id, req.user.role);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function getTaskById(req, res, next) {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, task });
  } catch (err) { next(err); }
}

async function updateTask(req, res, next) {
  try {
    const task = await taskService.updateTask(req.params.id, req.body, req.user._id, req.user.role);
    res.status(200).json({ success: true, task });
  } catch (err) { next(err); }
}

async function deleteTask(req, res, next) {
  try {
    await taskService.deleteTask(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (err) { next(err); }
}

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };
