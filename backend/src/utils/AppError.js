// Custom error class — attach a statusCode to any thrown error
// Usage: throw new AppError('Product not found', 404)

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes our errors from unexpected crashes
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;