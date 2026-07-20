// lib/utils/logger.ts
export function logError(context: string, error: unknown, meta?: Record<string, unknown>) {
  console.error(JSON.stringify({
    level: 'error',
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...meta,
    timestamp: new Date().toISOString(),
  }));
}
