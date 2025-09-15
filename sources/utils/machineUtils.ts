import type { Machine } from '@/sync/storageTypes';
import { connectionHealth } from '@/sync/connectionHealth';

export function isMachineOnline(machine: Machine): boolean {
    // If not active, definitely offline
    if (!machine.active) {
        return false;
    }

    // If active but no recent activity, consider offline
    // Use a 5-minute timeout for considering a machine truly online
    const ONLINE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const timeSinceLastActive = now - machine.activeAt;

    return timeSinceLastActive < ONLINE_TIMEOUT_MS;
}

/**
 * Enhanced machine status check using connection health monitoring
 */
export function getMachineConnectionState(machine: Machine) {
    const connectionState = connectionHealth.getConnectionState(machine.id);
    const basicOnline = isMachineOnline(machine);

    return {
        isOnline: basicOnline && connectionState.machine === 'online',
        status: connectionState.machine,
        lastVerified: connectionState.lastVerified,
        socketConnected: connectionState.socket === 'connected'
    };
}

/**
 * Check if it's safe to interact with a machine
 */
export async function canInteractWithMachine(machineId: string): Promise<{ canInteract: boolean; reason?: string }> {
    try {
        const healthResult = await connectionHealth.verifyMachineConnection(machineId);
        return {
            canInteract: healthResult.success,
            reason: healthResult.error
        };
    } catch (error) {
        return {
            canInteract: false,
            reason: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}