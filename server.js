const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory (if frontend folder exists)
const fs = require('fs');
const frontendPath = path.join(__dirname, '../frontend');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'PharmaCare API is running',
    timestamp: new Date().toISOString()
  });
});

// Use routes
app.use('/api', routes);

// Serve index.html for root route (if frontend exists)
app.get('/', (req, res) => {
  const frontendIndexPath = path.join(__dirname, '../frontend/index.html');
  if (fs.existsSync(frontendIndexPath)) {
    res.sendFile(frontendIndexPath);
  } else {
    res.json({
      success: true,
      message: 'PharmaCare Backend API',
      version: '1.0.0',
      endpoints: {
        health: 'GET /api/health',
        auth: 'GET /api/auth - View auth endpoints',
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      docs: 'See /api/auth for authentication endpoints'
    });
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});

