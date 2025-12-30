import { createConsola } from "consola";

/**
 * Centralized logger instance for the application.
 * Uses consola for styled, consistent logging across the app.
 *
 * Log Levels:
 * - 0: Fatal and Error
 * - 1: Warnings
 * - 2: Normal logs
 * - 3: Informational logs (default)
 * - 4: Debug logs
 * - 5: Trace logs
 *
 * Set CONSOLA_LEVEL environment variable to adjust log level.
 */
export const logger = createConsola({
    level: 5,
    formatOptions: {
        date: true,
        colors: true,
        compact: false
    }
});

/**
 * Create a scoped logger with a specific tag.
 * Useful for categorizing logs by module/feature.
 *
 * @example
 * const authLogger = createScopedLogger('auth');
 * authLogger.info('User logged in');
 */
export function createScopedLogger(tag: string) {
    return logger.withTag(tag);
}

export default logger;
