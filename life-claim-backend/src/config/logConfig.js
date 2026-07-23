const winston = require('winston');
const path = require('path');

// Construct the path to the log file
const logDir = path.join(__dirname, '..', 'logs');
const logFilePath = path.join(logDir, 'application.log');

const timezoned = () => {
    const date = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata'
    });
  
    // Convert the date string to a Date object
    const dateObj = new Date(date);
  
    // Format the date components
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  
    // Return the formatted date string
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

// Create a Winston logger instance
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: timezoned
          }),
    winston.format.json(),
   
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: logFilePath })
  ]
});

module.exports = logger;