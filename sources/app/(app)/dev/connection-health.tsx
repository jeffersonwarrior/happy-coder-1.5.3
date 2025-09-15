import React, { useState, useEffect } from 'react';
import { View, RefreshControl, ScrollView } from 'react-native';
import { Text } from '@/components/StyledText';
import { Ionicons } from '@expo/vector-icons';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { useAllMachines, useSocketStatus } from '@/sync/storage';
import { connectionHealth } from '@/sync/connectionHealth';
import { Typography } from '@/constants/Typography';
import { useUnistyles } from 'react-native-unistyles';
import { RoundButton } from '@/components/RoundButton';

interface HealthStatus {
    machineId: string;
    machineName: string;
    lastCheck: Date | null;
    status: 'healthy' | 'unhealthy' | 'checking' | 'unknown';
    latency: number | null;
    error: string | null;
}

export default function ConnectionHealthDebugScreen() {
    const { theme } = useUnistyles();
    const machines = useAllMachines();
    const socketStatus = useSocketStatus();
    const [healthStatuses, setHealthStatuses] = useState<HealthStatus[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Initialize health statuses
    useEffect(() => {
        const statuses: HealthStatus[] = machines.map(machine => ({
            machineId: machine.id,
            machineName: machine.metadata?.displayName || `Machine ${machine.id.slice(0, 8)}`,
            lastCheck: null,
            status: 'unknown' as const,
            latency: null,
            error: null
        }));
        setHealthStatuses(statuses);
    }, [machines]);

    // Manual health check for all machines
    const runHealthCheck = async () => {
        setIsRefreshing(true);
        const updatedStatuses = [...healthStatuses];

        for (let i = 0; i < updatedStatuses.length; i++) {
            const status = updatedStatuses[i];
            status.status = 'checking';
            setHealthStatuses([...updatedStatuses]);

            try {
                const startTime = Date.now();
                const result = await connectionHealth.verifyMachineConnection(status.machineId);
                const latency = Date.now() - startTime;

                status.lastCheck = new Date();
                status.status = result.success ? 'healthy' : 'unhealthy';
                status.latency = latency;
                status.error = result.error || null;
            } catch (error) {
                status.lastCheck = new Date();
                status.status = 'unhealthy';
                status.latency = null;
                status.error = error instanceof Error ? error.message : 'Unknown error';
            }

            setHealthStatuses([...updatedStatuses]);
        }

        setIsRefreshing(false);
    };

    const getStatusIcon = (status: HealthStatus['status']) => {
        switch (status) {
            case 'healthy':
                return <Ionicons name="checkmark-circle" size={24} color="#34C759" />;
            case 'unhealthy':
                return <Ionicons name="close-circle" size={24} color="#FF3B30" />;
            case 'checking':
                return <Ionicons name="sync" size={24} color="#007AFF" />;
            default:
                return <Ionicons name="help-circle" size={24} color="#8E8E93" />;
        }
    };

    const getStatusColor = (status: HealthStatus['status']) => {
        switch (status) {
            case 'healthy': return '#34C759';
            case 'unhealthy': return '#FF3B30';
            case 'checking': return '#007AFF';
            default: return '#8E8E93';
        }
    };

    const formatLatency = (latency: number | null) => {
        if (latency === null) return 'N/A';
        return `${latency}ms`;
    };

    const formatLastCheck = (lastCheck: Date | null) => {
        if (!lastCheck) return 'Never';
        const now = new Date();
        const diff = now.getTime() - lastCheck.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return `${seconds}s ago`;
    };

    return (
        <ItemList>
            {/* Global Status */}
            <ItemGroup title="Global Connection Status">
                <Item
                    title="Socket Connection"
                    detail={socketStatus.status}
                    icon={<Ionicons
                        name={socketStatus.status === 'connected' ? 'wifi' : 'wifi-outline'}
                        size={29}
                        color={socketStatus.status === 'connected' ? '#34C759' : '#FF3B30'}
                    />}
                    showChevron={false}
                />
                <Item
                    title="Connection Health Service"
                    detail={connectionHealth.isRunning ? 'Running' : 'Stopped'}
                    icon={<Ionicons
                        name={connectionHealth.isRunning ? 'pulse' : 'pause-circle'}
                        size={29}
                        color={connectionHealth.isRunning ? '#34C759' : '#FF3B30'}
                    />}
                    showChevron={false}
                />
            </ItemGroup>

            {/* Machine Health Status */}
            <ItemGroup
                title="Machine Health Status"
                footer="Shows the current connection health for each registered machine. Tap 'Check All' to run a fresh health check."
            >
                {healthStatuses.length === 0 ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{
                            ...Typography.default(),
                            color: theme.colors.textSecondary,
                            textAlign: 'center'
                        }}>
                            No machines registered
                        </Text>
                    </View>
                ) : (
                    healthStatuses.map((status) => (
                        <Item
                            key={status.machineId}
                            title={status.machineName}
                            subtitle={status.error || `Last check: ${formatLastCheck(status.lastCheck)}`}
                            detail={`${status.status} • ${formatLatency(status.latency)}`}
                            icon={getStatusIcon(status.status)}
                            showChevron={false}
                            style={{
                                opacity: status.status === 'checking' ? 0.7 : 1
                            }}
                        />
                    ))
                )}
            </ItemGroup>

            {/* Actions */}
            <ItemGroup>
                <View style={{ padding: 16 }}>
                    <RoundButton
                        title={isRefreshing ? "Checking..." : "Check All Machines"}
                        onPress={runHealthCheck}
                        disabled={isRefreshing || healthStatuses.length === 0}
                        loading={isRefreshing}
                        size="large"
                    />
                </View>
            </ItemGroup>

            {/* Debug Information */}
            <ItemGroup title="Debug Information">
                <Item
                    title="Health Check Interval"
                    detail="10-15 seconds"
                    icon={<Ionicons name="timer-outline" size={29} color="#007AFF" />}
                    showChevron={false}
                />
                <Item
                    title="Connection Timeout"
                    detail="5 seconds"
                    icon={<Ionicons name="hourglass-outline" size={29} color="#007AFF" />}
                    showChevron={false}
                />
                <Item
                    title="Cache Duration"
                    detail="10 seconds"
                    icon={<Ionicons name="archive-outline" size={29} color="#007AFF" />}
                    showChevron={false}
                />
            </ItemGroup>
        </ItemList>
    );
}