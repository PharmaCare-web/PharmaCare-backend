const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();


const routes = require('./routes/index');
const userRoutes = require('./routes/users'); // add this line with your users.js

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
  if (!origin) return callback(null, true); // Postman, mobile apps

  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  console.warn(`❌ CORS blocked origin: ${origin}`);
  return callback(null, false); // ← DO NOT throw error
};
}
else {
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


// Your other middleware like CORS and static files are already here

// Mount user routes
app.use('/api', userRoutes);   // <-- add this line here

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

// Auto-update database on startup (creates notification table if missing)
async function ensureDatabaseSchema() {
  try {
    const pool = require('./config/database');
    // Wait a moment for connection to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create notification table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification (
        notification_id SERIAL PRIMARY KEY,
        branch_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE
      );
    `);
    
    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notification_branch_id ON notification(branch_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notification(is_read);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(type);`);
    
    console.log('✅ Database schema verified (notification table ready)');
  } catch (error) {
    // Don't fail startup if table creation fails (might already exist or connection issue)
    console.warn('⚠️  Could not verify notification table (non-critical):', error.message);
  }
}

// Start server
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

// Ensure database schema before starting server
ensureDatabaseSchema().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`📡 API endpoints available at http://${HOST}:${PORT}/api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV === 'production') {
      console.log(`🔒 CORS: ${process.env.FRONTEND_URL || 'NOT CONFIGURED - REQUIRED!'}`);
    }
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

