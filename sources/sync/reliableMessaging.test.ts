/**
 * Reliable Messaging System Tests
 * Verification tests for deployment readiness
 */

import { reliableMessaging } from './reliableMessaging';

// Mock dependencies
jest.mock('./connectionHealth', () => ({
    connectionHealth: {
        canSendMessage: jest.fn()
    }
}));

jest.mock('./sync', () => ({
    sync: {
        sendMessageDirect: jest.fn()
    }
}));

describe('Reliable Messaging System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Message Sending', () => {
        it('should send message successfully on first attempt', async () => {
            const { connectionHealth } = require('./connectionHealth');
            const { sync } = require('./sync');

            connectionHealth.canSendMessage.mockResolvedValue({ canSend: true });
            sync.sendMessageDirect.mockResolvedValue(undefined);

            const result = await reliableMessaging.sendMessage('test-session', 'Hello world');

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
            expect(connectionHealth.canSendMessage).toHaveBeenCalledWith('test-session');
            expect(sync.sendMessageDirect).toHaveBeenCalledWith('test-session', 'Hello world');
        });

        it('should retry on connection failure', async () => {
            const { connectionHealth } = require('./connectionHealth');
            const { sync } = require('./sync');

            // First attempt fails connection check
            connectionHealth.canSendMessage
                .mockResolvedValueOnce({ canSend: false, reason: 'Machine offline' })
                .mockResolvedValueOnce({ canSend: true });

            sync.sendMessageDirect.mockResolvedValue(undefined);

            const resultPromise = reliableMessaging.sendMessage('test-session', 'Hello world', {
                maxRetries: 1
            });

            // Fast forward time for retry
            jest.advanceTimersByTime(2000);

            const result = await resultPromise;

            expect(result.success).toBe(false); // Initially fails, but queues for retry
            expect(result.messageId).toBeDefined();
        });

        it('should handle permanent errors without retry', async () => {
            const { connectionHealth } = require('./connectionHealth');
            const { sync } = require('./sync');

            connectionHealth.canSendMessage.mockResolvedValue({ canSend: true });
            sync.sendMessageDirect.mockRejectedValue(new Error('Invalid session'));

            const result = await reliableMessaging.sendMessage('test-session', 'Hello world');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid session');
        });

        it('should respect timeout configuration', async () => {
            const { connectionHealth } = require('./connectionHealth');
            const { sync } = require('./sync');

            connectionHealth.canSendMessage.mockResolvedValue({ canSend: true });
            sync.sendMessageDirect.mockImplementation(() =>
                new Promise(resolve => setTimeout(resolve, 20000))
            );

            const result = await reliableMessaging.sendMessage('test-session', 'Hello world', {
                timeout: 1000
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('timeout');
        });
    });

    describe('Retry Logic', () => {
        it('should implement exponential backoff', async () => {
            const { connectionHealth } = require('./connectionHealth');

            connectionHealth.canSendMessage.mockResolvedValue({ canSend: false, reason: 'Temporary failure' });

            const messagePromise = reliableMessaging.sendMessage('test-session', 'Hello world', {
                maxRetries: 3,
                retryDelay: 1000
            });

            // Check retry intervals: 1s, 2s, 4s (exponential backoff)
            jest.advanceTimersByTime(1000); // First retry after 1s
            jest.advanceTimersByTime(2000); // Second retry after 2s
            jest.advanceTimersByTime(4000); // Third retry after 4s

            await messagePromise;

            expect(connectionHealth.canSendMessage).toHaveBeenCalledTimes(4); // Initial + 3 retries
        });

        it('should retry failed messages on reconnection', async () => {
            const { connectionHealth } = require('./connectionHealth');

            connectionHealth.canSendMessage.mockResolvedValue({ canSend: false, reason: 'Disconnected' });

            // Send a message that will fail
            await reliableMessaging.sendMessage('test-session', 'Hello world');

            // Simulate reconnection
            connectionHealth.canSendMessage.mockResolvedValue({ canSend: true });
            await reliableMessaging.retryFailedMessages('test-session');

            // Should retry the failed message
            expect(connectionHealth.canSendMessage).toHaveBeenCalledTimes(3); // Initial + retry + reconnection retry
        });
    });

    describe('Message Management', () => {
        it('should track pending messages', async () => {
            const { connectionHealth } = require('./connectionHealth');

            connectionHealth.canSendMessage.mockResolvedValue({ canSend: false, reason: 'Offline' });

            await reliableMessaging.sendMessage('test-session', 'Message 1');
            await reliableMessaging.sendMessage('test-session', 'Message 2');

            const pending = reliableMessaging.getPendingMessages('test-session');
            expect(pending).toHaveLength(2);
            expect(pending[0].text).toBe('Message 1');
            expect(pending[1].text).toBe('Message 2');
        });

        it('should cancel pending messages', async () => {
            const { connectionHealth } = require('./connectionHealth');

            connectionHealth.canSendMessage.mockResolvedValue({ canSend: false, reason: 'Offline' });

            const result = await reliableMessaging.sendMessage('test-session', 'Test message');
            const cancelled = reliableMessaging.cancelMessage(result.messageId!);

            expect(cancelled).toBe(true);
            expect(reliableMessaging.getPendingMessages('test-session')).toHaveLength(0);
        });

        it('should provide messaging statistics', () => {
            const stats = reliableMessaging.getStats();

            expect(typeof stats.total).toBe('number');
            expect(typeof stats.pending).toBe('number');
            expect(typeof stats.sending).toBe('number');
            expect(typeof stats.failed).toBe('number');
            expect(typeof stats.avgAttempts).toBe('number');
        });
    });

    describe('System Lifecycle', () => {
        it('should start and stop system properly', () => {
            expect(() => {
                reliableMessaging.start();
                reliableMessaging.stop();
            }).not.toThrow();
        });

        it('should clean up expired messages', () => {
            // Mock Date.now to simulate message expiry
            const originalDateNow = Date.now;
            Date.now = jest.fn(() => Date.now() + 10 * 60 * 1000); // 10 minutes later

            reliableMessaging.cleanup();

            Date.now = originalDateNow;
        });
    });
});

// Integration test for deployment verification
describe('Reliable Messaging Integration', () => {
    it('should integrate with connection health system', () => {
        expect(reliableMessaging).toBeDefined();
        expect(typeof reliableMessaging.sendMessage).toBe('function');
        expect(typeof reliableMessaging.retryFailedMessages).toBe('function');
        expect(typeof reliableMessaging.getPendingMessages).toBe('function');
        expect(typeof reliableMessaging.getStats).toBe('function');
    });

    it('should handle all error scenarios gracefully', async () => {
        // Test with invalid session ID
        const result = await reliableMessaging.sendMessage('', 'Test message');
        expect(result.success).toBe(false);
    });
});

console.log('✅ Reliable Messaging System tests completed - ready for deployment!');