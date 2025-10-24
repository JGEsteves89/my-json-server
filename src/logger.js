import winston from 'winston';
import util from 'util';

const { format } = winston;

// ANSI colors for routes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
};

// Custom format to handle splat args like console.log
const utilFormatter = format((info) => {
  const splat = info[Symbol.for('splat')];
  if (splat) {
    info.message = util.format(info.message, ...splat);
  }
  return info;
});

// Logger factory
export const createLogger = (appName = '???', method = '-', route = '-') =>
  winston.createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      utilFormatter(), // <-- here is your custom format
      format.printf(({ message, timestamp }) => {
        return `[${colors.blue}${timestamp}${colors.reset}][${colors.cyan}${appName ?? '???'}${colors.reset}][${colors.green}${method}${colors.reset}][${colors.magenta}${route}${colors.reset}]: ${message}`;
      })
    ),
    transports: [new winston.transports.Console()],
  });
