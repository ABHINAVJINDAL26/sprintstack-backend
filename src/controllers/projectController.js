const projectService = require('../services/projectService');

async function createProject(req, res, next) {
  try {
    const project = await projectService.createProject(req.body, req.user._id);
    res.status(201).json({ success: true, project });
  } catch (err) { next(err); }
}

async function getAllProjects(req, res, next) {
  try {
    const projects = await projectService.getAllProjects(req.user._id, req.user.role);
    res.status(200).json({ success: true, count: projects.length, projects });
  } catch (err) { next(err); }
}

async function getProjectById(req, res, next) {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, project });
  } catch (err) { next(err); }
}

async function updateProject(req, res, next) {
  try {
    const project = await projectService.updateProject(req.params.id, req.body, req.user._id, req.user.role);
    res.status(200).json({ success: true, project });
  } catch (err) { next(err); }
}

async function deleteProject(req, res, next) {
  try {
    await projectService.deleteProject(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (err) { next(err); }
}

async function addTeamMember(req, res, next) {
  try {
    const project = await projectService.addTeamMember(req.params.id, req.body.email, req.user._id, req.user.role);
    res.status(200).json({ success: true, project });
  } catch (err) { next(err); }
}

module.exports = { createProject, getAllProjects, getProjectById, updateProject, deleteProject, addTeamMember };
