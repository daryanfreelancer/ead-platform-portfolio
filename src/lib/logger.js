// Sistema de logging estruturado para debugging
export class Logger {
  constructor(context) {
    this.context = context;
    this.logs = [];
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };

    this.logs.push(logEntry);
    
    // Log to console with structured format
    console.log(`[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`);
    if (data) {
      console.log('Data:', data);
    }
  }

  info(message, data = null) {
    this.log('info', message, data);
  }

  error(message, data = null) {
    this.log('error', message, data);
  }

  warn(message, data = null) {
    this.log('warn', message, data);
  }

  debug(message, data = null) {
    this.log('debug', message, data);
  }

  // Get all logs as a formatted string
  getAllLogs() {
    return this.logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.context}] ${log.message}` +
      (log.data ? `\nData: ${log.data}` : '')
    ).join('\n');
  }

  // Get error summary
  getErrorSummary() {
    const errors = this.logs.filter(log => log.level === 'error');
    return errors.length > 0 ? errors[errors.length - 1] : null;
  }
}

// Function to create consistent error responses
export function createErrorResponse(logger, message, statusCode = 500, details = null) {
  logger.error(message, details);
  
  const errorSummary = logger.getErrorSummary();
  
  return {
    error: message,
    details: details ? (typeof details === 'string' ? details : details.message) : null,
    timestamp: new Date().toISOString(),
    requestId: Math.random().toString(36).substring(2, 15),
    logs: process.env.NODE_ENV === 'development' ? logger.getAllLogs() : undefined
  };
}