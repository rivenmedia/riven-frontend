import { createConsola } from "consola";
import { env } from "$env/dynamic/public";

/**
 * Centralized logger instance for the application.
 * Uses consola for styled, consistent logging across the app.
 *
 * Available log levels:
 *
 * 0: Fatal and Error
 * 1: Warnings
 * 2: Normal logs
 * 3: Informational logs, success, fail, ready, start, ...
 * 4: Debug logs
 * 5: Trace logs
 * -999: Silent
 * +999: Verbose logs
 *
 * Set LOG_LEVEL environment variable to adjust log level.
 */
export const logger = createConsola({
    level: parseInt(String(env.PUBLIC_LOG_LEVEL), 10) || 3,
    formatOptions: {
        date: env.PUBLIC_LOG_DATE !== "false",
        colors: env.PUBLIC_LOG_COLORS !== "false",
        compact: env.PUBLIC_LOG_COMPACT === "true"
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
