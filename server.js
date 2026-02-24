require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
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
