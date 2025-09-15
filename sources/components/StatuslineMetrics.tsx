import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';

interface SessionUsage {
    inputTokens: number;
    outputTokens: number;
    cacheCreation: number;
    cacheRead: number;
    contextSize: number;
}

interface StatuslineMetricsProps {
    usage: SessionUsage | null;
    variant?: 'compact' | 'detailed';
    style?: any;
}

export const StatuslineMetrics = React.memo(({ usage, variant = 'compact', style }: StatuslineMetricsProps) => {
    const { theme } = useUnistyles();

    if (!usage) {
        return null;
    }

    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    };

    const formatTokens = (tokens: number): string => {
        return formatNumber(tokens);
    };

    const formatBytes = (bytes: number): string => {
        if (bytes >= 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
        } else if (bytes >= 1024) {
            return `${(bytes / 1024).toFixed(1)}KB`;
        }
        return `${bytes}B`;
    };

    const totalTokens = usage.inputTokens + usage.outputTokens;
    const cacheHitRate = usage.cacheRead > 0 ? Math.round((usage.cacheRead / (usage.cacheRead + usage.cacheCreation)) * 100) : 0;

    if (variant === 'compact') {
        return (
            <View style={[{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: theme.colors.surfaceHighest,
                borderRadius: 6,
                opacity: 0.8
            }, style]}>
                {/* Token Usage */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                    <Ionicons
                        name="cube-outline"
                        size={14}
                        color={theme.colors.textSecondary}
                        style={{ marginRight: 4 }}
                    />
                    <Text style={{
                        ...Typography.default(),
                        fontSize: 12,
                        color: theme.colors.textSecondary
                    }}>
                        {formatTokens(totalTokens)}
                    </Text>
                </View>

                {/* Context Size */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                    <Ionicons
                        name="layers-outline"
                        size={14}
                        color={theme.colors.textSecondary}
                        style={{ marginRight: 4 }}
                    />
                    <Text style={{
                        ...Typography.default(),
                        fontSize: 12,
                        color: theme.colors.textSecondary
                    }}>
                        {formatBytes(usage.contextSize)}
                    </Text>
                </View>

                {/* Cache Hit Rate (only if cache is being used) */}
                {(usage.cacheRead > 0 || usage.cacheCreation > 0) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons
                            name="flash-outline"
                            size={14}
                            color={cacheHitRate > 50 ? theme.colors.status.connected : theme.colors.textSecondary}
                            style={{ marginRight: 4 }}
                        />
                        <Text style={{
                            ...Typography.default(),
                            fontSize: 12,
                            color: cacheHitRate > 50 ? theme.colors.status.connected : theme.colors.textSecondary
                        }}>
                            {cacheHitRate}%
                        </Text>
                    </View>
                )}
            </View>
        );
    }

    // Detailed variant
    return (
        <View style={[{
            padding: 16,
            backgroundColor: theme.colors.surfaceHighest,
            borderRadius: 8,
            gap: 12
        }, style]}>
            <Text style={{
                ...Typography.default(),
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text,
                marginBottom: 8
            }}>
                Session Metrics
            </Text>

            {/* Token Breakdown */}
            <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="download-outline" size={16} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={{ ...Typography.default(), fontSize: 14, color: theme.colors.text }}>
                            Input Tokens
                        </Text>
                    </View>
                    <Text style={{ ...Typography.default(), fontSize: 14, color: theme.colors.textSecondary, fontFamily: 'monospace' }}>
                        {formatTokens(usage.inputTokens)}
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="arrow-up-outline" size={16} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={{ ...Typography.default(), fontSize: 14, color: theme.colors.text }}>
                            Output Tokens
                        </Text>
                    </View>
                    <Text style={{ ...Typography.default(), fontSize: 14, color: theme.colors.textSecondary, fontFamily: 'monospace' }}>
                        {formatTokens(usage.outputTokens)}
                    </Text>
                </View>

                <View style={{
                    height: 1,
                    backgroundColor: theme.colors.textSecondary,
                    opacity: 0.3,
                    marginVertical: 4
                }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="cube-outline" size={16} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={{ ...Typography.default(), fontSize: 14, fontWeight: '500', color: theme.colors.text }}>
                            Total Tokens
                        </Text>
                    </View>
                    <Text style={{ ...Typography.default(), fontSize: 14, fontWeight: '500', color: theme.colors.text, fontFamily: 'monospace' }}>
                        {formatTokens(totalTokens)}
                    </Text>
                </View>
            </View>

            {/* Context and Cache Info */}
            <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="layers-outline" size={16} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={{ ...Typography.default(), fontSize: 14, color: theme.colors.text }}>
                            Context Size
                        </Text>
                    </View>
                    <Text style={{ ...Typography.default(), fontSize: 14, color: theme.colors.textSecondary, fontFamily: 'monospace' }}>
                        {formatBytes(usage.contextSize)}
                    </Text>
                </View>

                {(usage.cacheRead > 0 || usage.cacheCreation > 0) && (
                    <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="flash-outline" size={16} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                                <Text style={{ ...Typography.default(), fontSize: 14, color: theme.colors.text }}>
                                    Cache Hit Rate
                                </Text>
                            </View>
                            <Text style={{
                                ...Typography.default(),
                                fontSize: 14,
                                color: cacheHitRate > 50 ? theme.colors.status.connected : theme.colors.textSecondary,
                                fontFamily: 'monospace'
                            }}>
                                {cacheHitRate}%
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 16, marginRight: 6 }} />
                                <Text style={{ ...Typography.default(), fontSize: 12, color: theme.colors.textSecondary }}>
                                    Cache Read
                                </Text>
                            </View>
                            <Text style={{ ...Typography.default(), fontSize: 12, color: theme.colors.textSecondary, fontFamily: 'monospace' }}>
                                {formatTokens(usage.cacheRead)}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 16, marginRight: 6 }} />
                                <Text style={{ ...Typography.default(), fontSize: 12, color: theme.colors.textSecondary }}>
                                    Cache Creation
                                </Text>
                            </View>
                            <Text style={{ ...Typography.default(), fontSize: 12, color: theme.colors.textSecondary, fontFamily: 'monospace' }}>
                                {formatTokens(usage.cacheCreation)}
                            </Text>
                        </View>
                    </>
                )}
            </View>
        </View>
    );
});

StatuslineMetrics.displayName = 'StatuslineMetrics';