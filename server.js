require('dotenv').config();
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const User = require('./src/models/userModel');
const Project = require('./src/models/projectModel');
const chatService = require('./src/services/chatService');

const PORT = process.env.PORT || 5000;

const isProjectMember = (project, userId) =>
  project.teamMembers.some((member) => member.toString() === userId.toString());

const start = async () => {
  await connectDB();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  app.set('io', io);

  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const rawToken = socket.handshake.auth?.token || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
      const token = rawToken?.startsWith('Bearer ') ? rawToken.split(' ')[1] : rawToken;

      if (!token) return next(new Error('Not authorized. No token provided.'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found. Token invalid.'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Not authorized. Token invalid or expired.'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_project', async (projectId, ack) => {
      try {
        if (!projectId) throw new Error('projectId is required');

        const project = await Project.findById(projectId).select('teamMembers');
        if (!project) throw new Error('Project not found');

        const allowed = socket.user.role === 'admin' || isProjectMember(project, socket.user._id);
        if (!allowed) throw new Error('Not authorized for this project room');

        socket.join(`project:${projectId}`);
        if (ack) ack({ ok: true });
      } catch (error) {
        if (ack) ack({ ok: false, message: error.message || 'Failed to join project room' });
      }
    });

    socket.on('send_message', async (payload, ack) => {
      try {
        const { projectId, message } = payload || {};
        if (!projectId) throw new Error('projectId is required');

        const createdMessage = await chatService.createProjectMessage(
          projectId,
          message,
          socket.user._id,
          socket.user.role
        );

        io.to(`project:${projectId}`).emit('project_message:new', {
          message: createdMessage,
        });

        if (ack) ack({ ok: true, message: createdMessage });
      } catch (error) {
        if (ack) ack({ ok: false, message: error.message || 'Failed to send message' });
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`🚀 SprintStack running in [${process.env.NODE_ENV}] mode on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Stop the running process or change PORT in backend/.env.`);
      process.exit(1);
    }

    console.error(`❌ Server startup error: ${error.message}`);
    process.exit(1);
  });
};

start();
