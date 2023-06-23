class AppError extends Error {
  constructor(message, statusCode) {
    //this built in error accepts only one argument, which is the message
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;
    this.status = `${statusCode}`.startsWith('4') ? 'failed' : 'error';

    //removing this class from stack track
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
