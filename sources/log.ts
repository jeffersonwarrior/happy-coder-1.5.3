/**
 * Simple logging mechanism that writes to console and maintains internal array
 * Keeps last 5k records in memory with change notifications for UI updates
 */
class Logger {
  private logs: string[] = [];
  private maxLogs = 5000;
  private listeners: Array<() => void> = [];

  /**
     * Log a message - writes to both console and internal array
     */
  log(message: string): void {
    // Add to internal array
    this.logs.push(message);

    // Maintain 5k limit with circular buffer
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Write to console
    console.log(message);

    // Notify listeners for real-time updates
    this.listeners.forEach(listener => listener());
  }

  /**
     * Log an error message - writes to both console and internal array
     */
  error(message: string, ...args: any[]): void {
    // Add to internal array with error prefix
    const errorMessage = `❌ ${message}`;
    this.logs.push(errorMessage);

    // Maintain 5k limit with circular buffer
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Write to console error with additional args
    console.error(errorMessage, ...args);

    // Notify listeners for real-time updates
    this.listeners.forEach(listener => listener());
  }

  /**
     * Log a warning message - writes to both console and internal array
     */
  warn(message: string, ...args: any[]): void {
    const warnMessage = `⚠️ ${message}`;
    this.logs.push(warnMessage);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    console.warn(warnMessage, ...args);
    this.listeners.forEach(listener => listener());
  }

  /**
     * Log a debug message - writes to both console and internal array
     */
  debug(message: string, ...args: any[]): void {
    const debugMessage = `🔍 ${message}`;
    this.logs.push(debugMessage);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    console.debug(debugMessage, ...args);
    this.listeners.forEach(listener => listener());
  }

  /**
     * Get all logs as a copy of the array
     */
  getLogs(): string[] {
    return [...this.logs];
  }

  /**
     * Get all logs as strings (same as getLogs for compatibility)
     */
  getLogsAsStrings(): string[] {
    return [...this.logs];
  }

  /**
     * Clear all logs
     */
  clear(): void {
    this.logs = [];
    this.listeners.forEach(listener => listener());
  }

  /**
     * Subscribe to log changes - returns unsubscribe function
     */
  onChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
     * Get current number of logs
     */
  getCount(): number {
    return this.logs.length;
  }
}

// Export singleton instance
export const log = new Logger();