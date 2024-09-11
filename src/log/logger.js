import { createLogger, format, transports } from 'winston';
const { combine, timestamp, label, printf, errors } = format;

const logFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

export const logger = createLogger({
  format: combine(
    label({ label: 'foxtrot' }),
    timestamp(),
    errors({ stack: true }),
    logFormat,
  ),
  transports: [new transports.Console({ level: process.env.FOXTROT_LOG_LEVEL || 'warn' })],
});
