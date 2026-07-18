type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, ...meta: unknown[]): void {
  const prefix = `[${level.toUpperCase()}]`;

  switch (level) {
    case 'debug':
      console.debug(prefix, message, ...meta);
      break;
    case 'info':
      console.info(prefix, message, ...meta);
      break;
    case 'warn':
      console.warn(prefix, message, ...meta);
      break;
    case 'error':
      console.error(prefix, message, ...meta);
      break;
  }
}

export const logger = {
  debug: (message: string, ...meta: unknown[]) => log('debug', message, ...meta),
  info: (message: string, ...meta: unknown[]) => log('info', message, ...meta),
  warn: (message: string, ...meta: unknown[]) => log('warn', message, ...meta),
  error: (message: string, ...meta: unknown[]) => log('error', message, ...meta),
};
