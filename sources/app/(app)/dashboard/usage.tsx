import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/Typography';
import { useAllSessions, storage } from '@/sync/storage';
import { StatuslineMetrics } from '@/components/StatuslineMetrics';
import { t } from '@/text';

interface UsageHistoryEntry {
    timestamp: number;
    sessionId: string;
    sessionName: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreation: number;
    cacheRead: number;
    contextSize: number;
}

interface AggregatedUsage {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCacheRead: number;
    totalCacheCreation: number;
    sessionCount: number;
    avgTokensPerSession: number;
    avgCacheHitRate: number;
}

export default function UsageDashboardScreen() {
    const { theme } = useUnistyles();
    const sessions = useAllSessions();
    const [refreshing, setRefreshing] = useState(false);
    const [usageHistory, setUsageHistory] = useState<UsageHistoryEntry[]>([]);
    const [aggregatedUsage, setAggregatedUsage] = useState<AggregatedUsage | null>(null);

    const calculateUsageData = React.useCallback(() => {
        const history: UsageHistoryEntry[] = [];
        let totalInput = 0;
        let totalOutput = 0;
        let totalCacheRead = 0;
        let totalCacheCreation = 0;
        let sessionCount = 0;

        sessions.forEach(session => {
            if (typeof session === 'string') return; // Skip section headers

            const usage = session.latestUsage;
            if (usage) {
                history.push({
                    timestamp: session.updatedAt || session.createdAt,
                    sessionId: session.id,
                    sessionName: session.metadata?.path || session.id.slice(0, 8),
                    inputTokens: usage.inputTokens || 0,
                    outputTokens: usage.outputTokens || 0,
                    cacheCreation: usage.cacheCreation || 0,
                    cacheRead: usage.cacheRead || 0,
                    contextSize: usage.contextSize || 0,
                });

                totalInput += usage.inputTokens || 0;
                totalOutput += usage.outputTokens || 0;
                totalCacheRead += usage.cacheRead || 0;
                totalCacheCreation += usage.cacheCreation || 0;
                sessionCount++;
            }
        });

        // Sort by timestamp descending (most recent first)
        history.sort((a, b) => b.timestamp - a.timestamp);

        const totalTokens = totalInput + totalOutput;
        const avgTokensPerSession = sessionCount > 0 ? totalTokens / sessionCount : 0;
        const totalCacheTokens = totalCacheRead + totalCacheCreation;
        const avgCacheHitRate = totalCacheTokens > 0 ? (totalCacheRead / totalCacheTokens) * 100 : 0;

        setUsageHistory(history);
        setAggregatedUsage({
            totalInputTokens: totalInput,
            totalOutputTokens: totalOutput,
            totalCacheRead,
            totalCacheCreation,
            sessionCount,
            avgTokensPerSession,
            avgCacheHitRate,
        });
    }, [sessions]);

    useEffect(() => {
        calculateUsageData();
    }, [calculateUsageData]);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            // Just recalculate data from current state
            calculateUsageData();
        } catch (error) {
            console.error('Failed to refresh usage data:', error);
        } finally {
            setRefreshing(false);
        }
    }, [calculateUsageData]);

    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toLocaleString();
    };

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: 'Token Usage Dashboard',
                    headerBackTitle: t('common.back'),
                }}
            />
            <ScrollView
                style={{ flex: 1, backgroundColor: theme.colors.groupped.background }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={{ padding: 16, gap: 16 }}>
                    {/* Overall Statistics */}
                    {aggregatedUsage && (
                        <View style={{
                            backgroundColor: theme.colors.surfaceHighest,
                            borderRadius: 12,
                            padding: 16,
                            gap: 16
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Ionicons name="analytics-outline" size={20} color={theme.colors.text} style={{ marginRight: 8 }} />
                                <Text style={{
                                    ...Typography.default(),
                                    fontSize: 18,
                                    fontWeight: '600',
                                    color: theme.colors.text
                                }}>
                                    Overall Statistics
                                </Text>
                            </View>

                            <View style={{ gap: 12 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ ...Typography.default(), fontSize: 14, color: theme.colors.textSecondary }}>
                                        Total Sessions
                                    </Text>
                                    <Text style={{ ...Typography.default(), fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
                                        {aggregatedUsage.sessionCount}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ ...Typography.default(), fontSize: 14, color: theme.colors.textSecondary }}>
                                        Total Tokens Used
                                    </Text>
                                    <Text style={{ ...Typography.default(), fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
                                        {formatNumber(aggregatedUsage.totalInputTokens + aggregatedUsage.totalOutputTokens)}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ ...Typography.default(), fontSize: 14, color: theme.colors.textSecondary }}>
                                        Average per Session
                                    </Text>
                                    <Text style={{ ...Typography.default(), fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
                                        {formatNumber(Math.round(aggregatedUsage.avgTokensPerSession))}
                                    </Text>
                                </View>

                                {(aggregatedUsage.totalCacheRead > 0 || aggregatedUsage.totalCacheCreation > 0) && (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={{ ...Typography.default(), fontSize: 14, color: theme.colors.textSecondary }}>
                                            Average Cache Hit Rate
                                        </Text>
                                        <Text style={{
                                            ...Typography.default(),
                                            fontSize: 14,
                                            fontWeight: '500',
                                            color: aggregatedUsage.avgCacheHitRate > 50 ? theme.colors.status.connected : theme.colors.text
                                        }}>
                                            {aggregatedUsage.avgCacheHitRate.toFixed(1)}%
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Token Breakdown */}
                    {aggregatedUsage && (
                        <StatuslineMetrics
                            usage={{
                                inputTokens: aggregatedUsage.totalInputTokens,
                                outputTokens: aggregatedUsage.totalOutputTokens,
                                cacheRead: aggregatedUsage.totalCacheRead,
                                cacheCreation: aggregatedUsage.totalCacheCreation,
                                contextSize: 0 // Not applicable for aggregated view
                            }}
                            variant="detailed"
                        />
                    )}

                    {/* Recent Session Usage */}
                    <View style={{
                        backgroundColor: theme.colors.surfaceHighest,
                        borderRadius: 12,
                        overflow: 'hidden'
                    }}>
                        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.divider }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="time-outline" size={20} color={theme.colors.text} style={{ marginRight: 8 }} />
                                <Text style={{
                                    ...Typography.default(),
                                    fontSize: 18,
                                    fontWeight: '600',
                                    color: theme.colors.text
                                }}>
                                    Recent Sessions
                                </Text>
                            </View>
                        </View>

                        {usageHistory.length === 0 ? (
                            <View style={{ padding: 32, alignItems: 'center' }}>
                                <Ionicons name="document-outline" size={48} color={theme.colors.textSecondary} />
                                <Text style={{
                                    ...Typography.default(),
                                    fontSize: 16,
                                    color: theme.colors.textSecondary,
                                    textAlign: 'center',
                                    marginTop: 12
                                }}>
                                    No usage data available
                                </Text>
                                <Text style={{
                                    ...Typography.default(),
                                    fontSize: 14,
                                    color: theme.colors.textSecondary,
                                    textAlign: 'center',
                                    marginTop: 4
                                }}>
                                    Start a Claude session to see usage statistics
                                </Text>
                            </View>
                        ) : (
                            <View>
                                {usageHistory.slice(0, 10).map((entry, index) => {
                                    const totalTokens = entry.inputTokens + entry.outputTokens;
                                    const cacheHitRate = entry.cacheRead > 0 ?
                                        Math.round((entry.cacheRead / (entry.cacheRead + entry.cacheCreation)) * 100) : 0;

                                    return (
                                        <View
                                            key={entry.sessionId}
                                            style={{
                                                padding: 16,
                                                borderBottomWidth: index < Math.min(usageHistory.length - 1, 9) ? 1 : 0,
                                                borderBottomColor: theme.colors.divider
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{
                                                        ...Typography.default(),
                                                        fontSize: 14,
                                                        fontWeight: '500',
                                                        color: theme.colors.text
                                                    }}>
                                                        {entry.sessionName}
                                                    </Text>
                                                    <Text style={{
                                                        ...Typography.default(),
                                                        fontSize: 12,
                                                        color: theme.colors.textSecondary,
                                                        marginTop: 2
                                                    }}>
                                                        {formatDate(entry.timestamp)}
                                                    </Text>
                                                </View>
                                                <View style={{ alignItems: 'flex-end' }}>
                                                    <Text style={{
                                                        ...Typography.default(),
                                                        fontSize: 14,
                                                        fontWeight: '500',
                                                        color: theme.colors.text
                                                    }}>
                                                        {formatNumber(totalTokens)} tokens
                                                    </Text>
                                                    {(entry.cacheRead > 0 || entry.cacheCreation > 0) && (
                                                        <Text style={{
                                                            ...Typography.default(),
                                                            fontSize: 12,
                                                            color: cacheHitRate > 50 ? theme.colors.status.connected : theme.colors.textSecondary,
                                                            marginTop: 2
                                                        }}>
                                                            {cacheHitRate}% cache hit
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}

                                {usageHistory.length > 10 && (
                                    <View style={{ padding: 16, alignItems: 'center' }}>
                                        <Text style={{
                                            ...Typography.default(),
                                            fontSize: 14,
                                            color: theme.colors.textSecondary
                                        }}>
                                            ... and {usageHistory.length - 10} more sessions
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </>
    );
}