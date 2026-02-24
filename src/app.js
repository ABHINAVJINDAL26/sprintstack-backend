const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const sprintRoutes = require('./routes/sprintRoutes');
const taskRoutes = require('./routes/taskRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

// Rate limiting: 100 req / 60s per IP
const limiter = new RateLimiterMemory({ points: 100, duration: 60 });
app.use(async (req, res, next) => {
  try {
    await limiter.consume(req.ip);
    next();
  } catch {
    res.status(429).json({ success: false, message: 'Too many requests. Please slow down.' });
  }
});

// Body parsing + sanitization
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Health check
app.get('/health', (_req, res) =>
  res.status(200).json({ status: 'ok', service: 'SprintStack API 🚀', timestamp: new Date() })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/tasks', taskRoutes);

// 404 + Global error handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
