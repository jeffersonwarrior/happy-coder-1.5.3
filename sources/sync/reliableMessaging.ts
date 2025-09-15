/**
 * Reliable Messaging System
 * Handles message sending with connection validation, retries, and recovery
 */

import { connectionHealth } from './connectionHealth';
import { sync } from './sync';
import { storage } from './storage';
import { randomUUID } from 'expo-crypto';

interface MessageAttempt {
    id: string;
    sessionId: string;
    text: string;
    attempt: number;
    maxAttempts: number;
    lastError?: string;
    timestamp: number;
    status: 'pending' | 'sending' | 'sent' | 'failed' | 'expired';
}

interface SendMessageOptions {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
    validateConnection?: boolean;
}

class ReliableMessagingSystem {
    private pendingMessages = new Map<string, MessageAttempt>();
    private retryTimeouts = new Map<string, NodeJS.Timeout>();

    // Default configuration
    private readonly DEFAULT_MAX_RETRIES = 3;
    private readonly DEFAULT_RETRY_DELAY = 2000; // 2 seconds
    private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
    private readonly MESSAGE_EXPIRY = 300000; // 5 minutes

    /**
     * Send a message with connection validation and retry logic
     */
    async sendMessage(
        sessionId: string,
        text: string,
        options: SendMessageOptions = {}
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {

        const messageId = randomUUID();
        const maxAttempts = (options.maxRetries || this.DEFAULT_MAX_RETRIES) + 1;

        const attempt: MessageAttempt = {
            id: messageId,
            sessionId,
            text,
            attempt: 1,
            maxAttempts,
            timestamp: Date.now(),
            status: 'pending'
        };

        this.pendingMessages.set(messageId, attempt);

        try {
            const result = await this.attemptSendMessage(attempt, options);

            if (result.success) {
                attempt.status = 'sent';
                this.pendingMessages.delete(messageId);
                return { success: true, messageId };
            } else {
                // Schedule retry if attempts remain
                if (attempt.attempt < attempt.maxAttempts) {
                    this.scheduleRetry(messageId, options);
                    return { success: false, error: 'Message queued for retry', messageId };
                } else {
                    attempt.status = 'failed';
                    attempt.lastError = result.error;
                    return { success: false, error: result.error, messageId };
                }
            }
        } catch (error) {
            attempt.status = 'failed';
            attempt.lastError = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: attempt.lastError,
                messageId
            };
        }
    }

    /**
     * Attempt to send a single message
     */
    private async attemptSendMessage(
        attempt: MessageAttempt,
        options: SendMessageOptions
    ): Promise<{ success: boolean; error?: string }> {

        const { sessionId, text } = attempt;
        attempt.status = 'sending';

        try {
            // Step 1: Validate connection if requested
            if (options.validateConnection !== false) {
                const connectionCheck = await connectionHealth.canSendMessage(sessionId);
                if (!connectionCheck.canSend) {
                    return { success: false, error: connectionCheck.reason };
                }
            }

            // Step 2: Send the message with timeout
            const sendPromise = sync.sendMessageDirect(sessionId, text);
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Message send timeout')),
                    options.timeout || this.DEFAULT_TIMEOUT);
            });

            await Promise.race([sendPromise, timeoutPromise]);

            // Step 3: Verify message was received (optional future enhancement)
            // Could check for message echo or confirmation from server

            return { success: true };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Categorize errors for better retry logic
            if (errorMessage.includes('timeout') ||
                errorMessage.includes('network') ||
                errorMessage.includes('disconnected')) {
                // Transient errors - worth retrying
                attempt.lastError = errorMessage;
                return { success: false, error: errorMessage };
            } else {
                // Permanent errors - don't retry
                attempt.status = 'failed';
                return { success: false, error: errorMessage };
            }
        }
    }

    /**
     * Schedule a retry attempt
     */
    private scheduleRetry(messageId: string, options: SendMessageOptions) {
        const attempt = this.pendingMessages.get(messageId);
        if (!attempt) return;

        // Clear existing timeout
        const existingTimeout = this.retryTimeouts.get(messageId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Calculate retry delay with exponential backoff
        const baseDelay = options.retryDelay || this.DEFAULT_RETRY_DELAY;
        const delay = baseDelay * Math.pow(2, attempt.attempt - 1); // 2s, 4s, 8s...

        const timeout = setTimeout(async () => {
            const currentAttempt = this.pendingMessages.get(messageId);
            if (!currentAttempt || currentAttempt.status !== 'pending') {
                return;
            }

            currentAttempt.attempt++;

            // Check if message has expired
            if (Date.now() - currentAttempt.timestamp > this.MESSAGE_EXPIRY) {
                currentAttempt.status = 'expired';
                this.pendingMessages.delete(messageId);
                this.retryTimeouts.delete(messageId);
                return;
            }

            const result = await this.attemptSendMessage(currentAttempt, options);

            if (result.success) {
                currentAttempt.status = 'sent';
                this.pendingMessages.delete(messageId);
                this.retryTimeouts.delete(messageId);
            } else if (currentAttempt.attempt < currentAttempt.maxAttempts) {
                // Schedule another retry
                this.scheduleRetry(messageId, options);
            } else {
                // Max attempts reached
                currentAttempt.status = 'failed';
                currentAttempt.lastError = result.error;
                this.retryTimeouts.delete(messageId);
            }
        }, delay);

        this.retryTimeouts.set(messageId, timeout);
    }

    /**
     * Cancel a pending message
     */
    cancelMessage(messageId: string): boolean {
        const attempt = this.pendingMessages.get(messageId);
        if (!attempt || attempt.status === 'sent') {
            return false;
        }

        // Clear retry timeout
        const timeout = this.retryTimeouts.get(messageId);
        if (timeout) {
            clearTimeout(timeout);
            this.retryTimeouts.delete(messageId);
        }

        // Remove from pending
        this.pendingMessages.delete(messageId);
        return true;
    }

    /**
     * Get pending messages for a session
     */
    getPendingMessages(sessionId: string): MessageAttempt[] {
        return Array.from(this.pendingMessages.values())
            .filter(attempt => attempt.sessionId === sessionId);
    }

    /**
     * Get all pending messages (for debugging)
     */
    getAllPendingMessages(): MessageAttempt[] {
        return Array.from(this.pendingMessages.values());
    }

    /**
     * Retry all failed messages for a session (called after reconnection)
     */
    async retryFailedMessages(sessionId: string): Promise<void> {
        const failedMessages = Array.from(this.pendingMessages.values())
            .filter(attempt =>
                attempt.sessionId === sessionId &&
                (attempt.status === 'failed' || attempt.status === 'pending')
            );

        for (const attempt of failedMessages) {
            // Reset attempt counter and status
            attempt.attempt = 1;
            attempt.status = 'pending';
            attempt.lastError = undefined;

            // Schedule immediate retry
            this.scheduleRetry(attempt.id, {});
        }
    }

    /**
     * Clean up expired messages
     */
    cleanup(): void {
        const now = Date.now();
        const expired: string[] = [];

        for (const [messageId, attempt] of this.pendingMessages.entries()) {
            if (now - attempt.timestamp > this.MESSAGE_EXPIRY) {
                expired.push(messageId);
            }
        }

        for (const messageId of expired) {
            this.cancelMessage(messageId);
        }
    }

    /**
     * Get messaging statistics
     */
    getStats() {
        const attempts = Array.from(this.pendingMessages.values());

        return {
            total: attempts.length,
            pending: attempts.filter(a => a.status === 'pending').length,
            sending: attempts.filter(a => a.status === 'sending').length,
            failed: attempts.filter(a => a.status === 'failed').length,
            expired: attempts.filter(a => a.status === 'expired').length,
            avgAttempts: attempts.length > 0
                ? attempts.reduce((sum, a) => sum + a.attempt, 0) / attempts.length
                : 0
        };
    }

    /**
     * Start periodic cleanup
     */
    start(): void {
        // Clean up expired messages every minute
        setInterval(() => {
            this.cleanup();
        }, 60000);
    }

    /**
     * Stop and clean up all pending operations
     */
    stop(): void {
        // Clear all timeouts
        for (const timeout of this.retryTimeouts.values()) {
            clearTimeout(timeout);
        }

        this.retryTimeouts.clear();
        this.pendingMessages.clear();
    }
}

// Export singleton instance
export const reliableMessaging = new ReliableMessagingSystem();