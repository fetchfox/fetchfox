import { createLogger, format, transports } from 'winston';
const { combine, timestamp, label, printf, errors } = format;

const logFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

export const logger = createLogger({
  format: combine(
    label({ label: 'fetchfox' }),
    timestamp(),
    errors({ stack: true }),
    logFormat,
  ),
  transports: [new transports.Console({
    level: (
      process.env.FETCHFOX_LOG_LEVEL ||
      process.env.FF_LOG ||
      'warn')
  })],
});
