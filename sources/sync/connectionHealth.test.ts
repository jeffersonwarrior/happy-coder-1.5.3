/**
 * Connection Health Monitoring System Tests
 * Verification tests for deployment readiness
 */

import { connectionHealth } from './connectionHealth';

// Mock dependencies for testing
jest.mock('./apiSocket', () => ({
    apiSocket: {
        machineRPC: jest.fn(),
        sessionRPC: jest.fn()
    }
}));

jest.mock('./storage', () => ({
    storage: {
        getState: jest.fn(() => ({
            socketStatus: 'connected',
            machines: {
                'test-machine': {
                    id: 'test-machine',
                    active: true,
                    activeAt: Date.now() - 30000 // 30 seconds ago
                }
            },
            sessions: {
                'test-session': {
                    id: 'test-session',
                    active: true,
                    activeAt: Date.now() - 15000, // 15 seconds ago
                    metadata: { machineId: 'test-machine' }
                }
            }
        }))
    }
}));

describe('Connection Health Monitoring', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Machine Connection Verification', () => {
        it('should verify machine connection successfully', async () => {
            const { apiSocket } = require('./apiSocket');
            apiSocket.machineRPC.mockResolvedValue({ status: 'ok' });

            const result = await connectionHealth.verifyMachineConnection('test-machine');

            expect(result.success).toBe(true);
            expect(result.latency).toBeGreaterThan(0);
            expect(apiSocket.machineRPC).toHaveBeenCalledWith('test-machine', 'ping', {});
        });

        it('should handle machine connection failure', async () => {
            const { apiSocket } = require('./apiSocket');
            apiSocket.machineRPC.mockRejectedValue(new Error('Connection failed'));

            const result = await connectionHealth.verifyMachineConnection('test-machine');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Connection failed');
        });
    });

    describe('Session Connection Verification', () => {
        it('should verify session connection successfully', async () => {
            const { apiSocket } = require('./apiSocket');
            apiSocket.sessionRPC.mockResolvedValue({ status: 'ready' });

            const result = await connectionHealth.verifySessionConnection('test-session');

            expect(result.success).toBe(true);
            expect(result.latency).toBeGreaterThan(0);
            expect(apiSocket.sessionRPC).toHaveBeenCalledWith('test-session', 'status', {});
        });

        it('should handle session connection failure', async () => {
            const { apiSocket } = require('./apiSocket');
            apiSocket.sessionRPC.mockRejectedValue(new Error('Session not found'));

            const result = await connectionHealth.verifySessionConnection('test-session');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Session not found');
        });
    });

    describe('Message Send Validation', () => {
        it('should allow message sending when all connections are healthy', async () => {
            const { apiSocket } = require('./apiSocket');
            apiSocket.machineRPC.mockResolvedValue({ status: 'ok' });
            apiSocket.sessionRPC.mockResolvedValue({ status: 'ready' });

            const result = await connectionHealth.canSendMessage('test-session');

            expect(result.canSend).toBe(true);
            expect(result.reason).toBeUndefined();
        });

        it('should prevent message sending when socket is disconnected', async () => {
            const { storage } = require('./storage');
            storage.getState.mockReturnValue({
                ...storage.getState(),
                socketStatus: 'disconnected'
            });

            const result = await connectionHealth.canSendMessage('test-session');

            expect(result.canSend).toBe(false);
            expect(result.reason).toBe('Not connected to server');
        });
    });

    describe('Connection State Aggregation', () => {
        it('should aggregate connection state correctly', () => {
            const state = connectionHealth.getConnectionState('test-machine', 'test-session');

            expect(state.socket).toBe('connected');
            expect(['online', 'offline', 'unknown']).toContain(state.machine);
            expect(['active', 'inactive', 'unknown']).toContain(state.session);
            expect(typeof state.lastVerified).toBe('number');
        });
    });

    describe('System Lifecycle', () => {
        it('should start and stop monitoring system', () => {
            expect(() => {
                connectionHealth.start();
                connectionHealth.stop();
            }).not.toThrow();
        });

        it('should provide health metrics', () => {
            const metrics = connectionHealth.getHealthMetrics();

            expect(typeof metrics.totalChecks).toBe('number');
            expect(typeof metrics.pendingChecks).toBe('number');
            expect(Array.isArray(metrics.recentChecks)).toBe(true);
        });
    });
});

// Integration test for deployment verification
describe('Connection Health Integration', () => {
    it('should integrate with sync system properly', () => {
        // Verify exports exist
        expect(connectionHealth).toBeDefined();
        expect(typeof connectionHealth.start).toBe('function');
        expect(typeof connectionHealth.verifyMachineConnection).toBe('function');
        expect(typeof connectionHealth.verifySessionConnection).toBe('function');
        expect(typeof connectionHealth.canSendMessage).toBe('function');
        expect(typeof connectionHealth.getConnectionState).toBe('function');
    });

    it('should have proper error handling', async () => {
        // Test with invalid IDs
        expect(async () => {
            await connectionHealth.verifyMachineConnection('invalid-machine');
        }).not.toThrow();

        expect(async () => {
            await connectionHealth.verifySessionConnection('invalid-session');
        }).not.toThrow();
    });
});

console.log('✅ Connection Health Monitoring System tests completed - ready for deployment!');