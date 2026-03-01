const Project = require('../models/projectModel');
const AppError = require('../utils/appError');

function checkProjectAccess(projectIdParam = 'id') {
  return async (req, _res, next) => {
    try {
      const projectId = req.params[projectIdParam];
      const userId = req.user?._id;
      const userRole = req.user?.role;

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const project = await Project.findById(projectId).select('createdBy teamMembers');
      if (!project) {
        throw new AppError('Project not found', 404);
      }

      const isMember = project.teamMembers.some((memberId) => memberId.toString() === userId.toString());
      const isAdmin = userRole === 'admin';

      if (!isMember && !isAdmin) {
        throw new AppError('Access denied. You are not a member of this project.', 403);
      }

      req.projectAccess = {
        projectId,
        isMember,
        isAdmin,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  checkProjectAccess,
};
