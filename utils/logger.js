const winston = require("winston")

const format = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level.toUpperCase()} ${message}`
})

const transports = [
  new winston.transports.Console(),
]

module.exports = winston.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.timestamp(), format),
  exceptionHandlers: transports,
  transports,
})
