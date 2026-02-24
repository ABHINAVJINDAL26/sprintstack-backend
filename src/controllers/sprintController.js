const sprintService = require('../services/sprintService');

async function createSprint(req, res, next) {
  try {
    const sprint = await sprintService.createSprint(req.body, req.user._id, req.user.role);
    res.status(201).json({ success: true, sprint });
  } catch (err) { next(err); }
}

async function getSprintsByProject(req, res, next) {
  try {
    const sprints = await sprintService.getSprintsByProject(req.params.projectId, req.user._id, req.user.role);
    res.status(200).json({ success: true, count: sprints.length, sprints });
  } catch (err) { next(err); }
}

async function getSprintById(req, res, next) {
  try {
    const sprint = await sprintService.getSprintById(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, sprint });
  } catch (err) { next(err); }
}

async function updateSprint(req, res, next) {
  try {
    const sprint = await sprintService.updateSprint(req.params.id, req.body, req.user._id, req.user.role);
    res.status(200).json({ success: true, sprint });
  } catch (err) { next(err); }
}

async function getSprintProgress(req, res, next) {
  try {
    const progress = await sprintService.getSprintProgress(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, ...progress });
  } catch (err) { next(err); }
}

module.exports = { createSprint, getSprintsByProject, getSprintById, updateSprint, getSprintProgress };
