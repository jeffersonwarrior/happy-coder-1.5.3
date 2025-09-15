/**
 * Connection Health Monitoring System
 * Provides real-time verification of the full connection chain:
 * Mobile → Happy Server → Machine Daemon → Claude Code CLI
 */

import { apiSocket } from './apiSocket';
import { storage } from './storage';
import type { Machine, Session } from './storageTypes';

interface ConnectionState {
    socket: 'connected' | 'disconnected' | 'connecting' | 'error';
    machine: 'online' | 'offline' | 'unknown';
    session: 'active' | 'inactive' | 'unknown';
    lastVerified: number;
}

interface HealthCheckResult {
    success: boolean;
    latency?: number;
    error?: string;
    timestamp: number;
}

class ConnectionHealthMonitor {
    private healthChecks = new Map<string, HealthCheckResult>();
    private pendingChecks = new Set<string>();
    private checkInterval: NodeJS.Timeout | null = null;

    // Configuration
    private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
    private readonly MACHINE_TIMEOUT = 60000; // 1 minute (reduced from 5 min)
    private readonly SESSION_TIMEOUT = 120000; // 2 minutes
    private readonly MAX_RETRY_ATTEMPTS = 3;

    start() {
        if (this.checkInterval) return;

        // Run health checks periodically
        this.checkInterval = setInterval(() => {
            this.runPeriodicHealthChecks();
        }, this.HEALTH_CHECK_INTERVAL);

        // Run initial check
        this.runPeriodicHealthChecks();
    }

    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.healthChecks.clear();
        this.pendingChecks.clear();
    }

    get isRunning(): boolean {
        return this.checkInterval !== null;
    }

    /**
     * Check if a machine is truly online (end-to-end verification)
     */
    async verifyMachineConnection(machineId: string): Promise<HealthCheckResult> {
        const cacheKey = `machine:${machineId}`;

        // Return cached result if recent
        const cached = this.healthChecks.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 10000) { // 10 second cache
            return cached;
        }

        // Prevent duplicate checks
        if (this.pendingChecks.has(cacheKey)) {
            return { success: false, error: 'Check in progress', timestamp: Date.now() };
        }

        this.pendingChecks.add(cacheKey);
        const startTime = Date.now();

        try {
            // Send ping to machine daemon
            const result = await apiSocket.machineRPC<{ status: string }, {}>(
                machineId,
                'ping',
                {}
            );

            const latency = Date.now() - startTime;
            const healthResult: HealthCheckResult = {
                success: result.status === 'ok',
                latency,
                timestamp: Date.now()
            };

            this.healthChecks.set(cacheKey, healthResult);
            return healthResult;

        } catch (error) {
            const healthResult: HealthCheckResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now()
            };

            this.healthChecks.set(cacheKey, healthResult);
            return healthResult;

        } finally {
            this.pendingChecks.delete(cacheKey);
        }
    }

    /**
     * Check if a session is truly active (can receive messages)
     */
    async verifySessionConnection(sessionId: string): Promise<HealthCheckResult> {
        const cacheKey = `session:${sessionId}`;

        // Return cached result if recent
        const cached = this.healthChecks.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 15000) { // 15 second cache
            return cached;
        }

        // Prevent duplicate checks
        if (this.pendingChecks.has(cacheKey)) {
            return { success: false, error: 'Check in progress', timestamp: Date.now() };
        }

        this.pendingChecks.add(cacheKey);
        const startTime = Date.now();

        try {
            // Send lightweight status check to Claude Code session
            const result = await apiSocket.sessionRPC<{ status: string }, {}>(
                sessionId,
                'status',
                {}
            );

            const latency = Date.now() - startTime;
            const healthResult: HealthCheckResult = {
                success: result.status === 'ok' || result.status === 'ready',
                latency,
                timestamp: Date.now()
            };

            this.healthChecks.set(cacheKey, healthResult);
            return healthResult;

        } catch (error) {
            const healthResult: HealthCheckResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now()
            };

            this.healthChecks.set(cacheKey, healthResult);
            return healthResult;

        } finally {
            this.pendingChecks.delete(cacheKey);
        }
    }

    /**
     * Get comprehensive connection state for UI
     */
    getConnectionState(machineId?: string, sessionId?: string): ConnectionState {
        const now = Date.now();

        // Socket state (from apiSocket)
        const socketStatus = storage.getState().socketStatus || 'disconnected';

        // Machine state
        let machineState: 'online' | 'offline' | 'unknown' = 'unknown';
        if (machineId) {
            const machineHealth = this.healthChecks.get(`machine:${machineId}`);
            const machine = storage.getState().machines[machineId];

            if (machineHealth) {
                machineState = machineHealth.success ? 'online' : 'offline';
            } else if (machine) {
                // Fallback to existing logic with shorter timeout
                const timeSinceActive = now - machine.activeAt;
                machineState = machine.active && timeSinceActive < this.MACHINE_TIMEOUT ? 'online' : 'offline';
            }
        }

        // Session state
        let sessionState: 'active' | 'inactive' | 'unknown' = 'unknown';
        if (sessionId) {
            const sessionHealth = this.healthChecks.get(`session:${sessionId}`);
            const session = storage.getState().sessions[sessionId];

            if (sessionHealth) {
                sessionState = sessionHealth.success ? 'active' : 'inactive';
            } else if (session) {
                // Fallback to existing logic with shorter timeout
                const timeSinceActive = now - session.activeAt;
                sessionState = session.active && timeSinceActive < this.SESSION_TIMEOUT ? 'active' : 'inactive';
            }
        }

        return {
            socket: socketStatus,
            machine: machineState,
            session: sessionState,
            lastVerified: Math.max(
                ...[machineId, sessionId].map(id => {
                    if (!id) return 0;
                    const key = id.includes('-') ? `session:${id}` : `machine:${id}`;
                    return this.healthChecks.get(key)?.timestamp || 0;
                })
            )
        };
    }

    /**
     * Check if it's safe to send a message (full chain verification)
     */
    async canSendMessage(sessionId: string): Promise<{ canSend: boolean; reason?: string }> {
        // Get session and machine info
        const session = storage.getState().sessions[sessionId];
        if (!session?.metadata?.machineId) {
            return { canSend: false, reason: 'Session or machine not found' };
        }

        const machineId = session.metadata.machineId;

        // Check socket connection
        if (storage.getState().socketStatus !== 'connected') {
            return { canSend: false, reason: 'Not connected to server' };
        }

        // Verify machine connection
        const machineHealth = await this.verifyMachineConnection(machineId);
        if (!machineHealth.success) {
            return { canSend: false, reason: `Machine offline: ${machineHealth.error}` };
        }

        // Verify session connection
        const sessionHealth = await this.verifySessionConnection(sessionId);
        if (!sessionHealth.success) {
            return { canSend: false, reason: `Session inactive: ${sessionHealth.error}` };
        }

        return { canSend: true };
    }

    /**
     * Run periodic health checks on active sessions/machines
     */
    private async runPeriodicHealthChecks() {
        const state = storage.getState();

        // Check active machines
        const activeMachines = Object.values(state.machines).filter(machine =>
            machine.active || Date.now() - machine.activeAt < this.MACHINE_TIMEOUT
        );

        // Check active sessions
        const activeSessions = Object.values(state.sessions).filter(session =>
            session.active || Date.now() - session.activeAt < this.SESSION_TIMEOUT
        );

        // Run health checks (max 3 concurrent to avoid overload)
        const checks: Promise<any>[] = [];

        for (const machine of activeMachines.slice(0, 3)) {
            checks.push(this.verifyMachineConnection(machine.id));
        }

        for (const session of activeSessions.slice(0, 3)) {
            if (session.metadata?.machineId) {
                checks.push(this.verifySessionConnection(session.id));
            }
        }

        // Wait for all checks (with timeout)
        await Promise.allSettled(checks.map(check =>
            Promise.race([
                check,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 5000))
            ])
        ));
    }

    /**
     * Force refresh health status (called after connection issues)
     */
    async forceRefresh(machineId?: string, sessionId?: string) {
        if (machineId) {
            this.healthChecks.delete(`machine:${machineId}`);
            await this.verifyMachineConnection(machineId);
        }

        if (sessionId) {
            this.healthChecks.delete(`session:${sessionId}`);
            await this.verifySessionConnection(sessionId);
        }

        if (!machineId && !sessionId) {
            // Refresh all
            this.healthChecks.clear();
            this.runPeriodicHealthChecks();
        }
    }

    /**
     * Get health metrics for debugging
     */
    getHealthMetrics() {
        return {
            totalChecks: this.healthChecks.size,
            pendingChecks: this.pendingChecks.size,
            recentChecks: Array.from(this.healthChecks.entries()).map(([key, result]) => ({
                key,
                success: result.success,
                latency: result.latency,
                age: Date.now() - result.timestamp
            }))
        };
    }
}

// Export singleton instance
export const connectionHealth = new ConnectionHealthMonitor();