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

  // MySQL errors
  if (err.code && err.code.startsWith('ER_')) {
    console.error('MySQL Error:', err.code, err.message);
    console.error('SQL Message:', err.sqlMessage);
    
    // Provide more helpful error messages
    let errorMessage = 'Database error occurred';
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Database schema error. Please run the database migration.';
    } else if (err.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Duplicate entry. This email may already be registered.';
    } else if (err.sqlMessage) {
      errorMessage = err.sqlMessage;
    }
    
    return res.status(500).json({
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

