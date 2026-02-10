/**
 * Debug instrumentation: append NDJSON to workspace log file.
 * Path must match debug mode log path for analysis.
 */
const LOG_PATH =
  '/home/tiago/Documents/MyCredit/raf-mapa-producao-app/.cursor/debug.log';

export function debugLog(payload: Record<string, unknown>): void {
  try {
    const fs = require('fs');
    fs.appendFileSync(LOG_PATH, JSON.stringify(payload) + '\n');
  } catch {
    // ignore
  }
}
