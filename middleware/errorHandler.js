const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  console.error('Error stack:', err.stack);

  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }

  // File system errors
  if (err.code === 'ENOENT') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      success: false,
      message: 'Database connection error. Please try again later.'
    });
  }

  // PostgreSQL errors
  if (err.code && (err.code.startsWith('ER_') || err.code.startsWith('23') || err.code.startsWith('42'))) {
    console.error('Database Error:', err.code, err.message);
    
    // Provide more helpful error messages
    let errorMessage = 'Database error occurred';
    let statusCode = 500;
    
    // PostgreSQL unique violation (duplicate entry)
    if (err.code === '23505' || err.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Duplicate entry. This email may already be registered.';
      statusCode = 409;
    }
    // PostgreSQL foreign key violation
    else if (err.code === '23503') {
      errorMessage = 'Referenced record does not exist.';
      statusCode = 400;
    }
    // PostgreSQL not null violation
    else if (err.code === '23502') {
      errorMessage = 'Required field is missing.';
      statusCode = 400;
    }
    // PostgreSQL invalid input syntax
    else if (err.code === '22P02' || err.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Invalid input data.';
      statusCode = 400;
    }
    // Database schema errors
    else if (err.code === '42P01' || err.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Database schema error. Please run the database migration.';
      statusCode = 500;
    }
    else if (err.detail) {
      errorMessage = err.detail;
    }
    else if (err.message) {
      errorMessage = err.message;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      errorCode: err.code
    });
  }

  // Default error - always ensure response is sent
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;

