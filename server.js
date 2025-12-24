const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration - secure for production
const corsOptions = {
  credentials: true,
  optionsSuccessStatus: 200
};

if (process.env.NODE_ENV === 'production') {
  // In production, require FRONTEND_URL to be set
  if (!process.env.FRONTEND_URL) {
    console.warn('⚠️  WARNING: FRONTEND_URL not set in production. CORS may be restricted.');
  }
  // Support multiple origins (comma-separated) or single origin
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : [];
  
  corsOptions.origin = (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.length === 0) {
      console.warn('⚠️  No allowed origins configured. Rejecting CORS request.');
      return callback(new Error('CORS: No allowed origins configured'));
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  };
} else {
  // In development, allow localhost and the configured FRONTEND_URL
  const devOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ];
  
  if (process.env.FRONTEND_URL) {
    devOrigins.push(process.env.FRONTEND_URL);
  }
  
  corsOptions.origin = (origin, callback) => {
    if (!origin || devOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in dev for flexibility
    }
  };
}

app.use(cors(corsOptions));
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
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📡 API endpoints available at http://${HOST}:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🔒 CORS: ${process.env.FRONTEND_URL || 'NOT CONFIGURED - REQUIRED!'}`);
  }
});

