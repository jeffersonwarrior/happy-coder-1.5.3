/**
 * Message Retry Status Indicator Component
 * Shows users when messages are being retried automatically
 */

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUnistyles, StyleSheet } from 'react-native-unistyles';
import { reliableMessaging } from '@/sync/reliableMessaging';
import { t } from '@/text';

interface MessageRetryIndicatorProps {
    sessionId: string;
}

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.warning + '20',
        borderColor: theme.colors.warning,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 16,
        marginVertical: 4,
    },
    icon: {
        marginRight: 8,
    },
    text: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.warning,
        fontWeight: '500',
    },
    spinner: {
        marginLeft: 8,
    }
}));

export const MessageRetryIndicator: React.FC<MessageRetryIndicatorProps> = ({ sessionId }) => {
    const { theme } = useUnistyles();
    const styles = stylesheet;

    const [pendingMessages, setPendingMessages] = React.useState<any[]>([]);
    const [retryStats, setRetryStats] = React.useState<any>(null);

    // Poll for pending messages and retry status
    React.useEffect(() => {
        const updateStatus = () => {
            const pending = reliableMessaging.getPendingMessages(sessionId);
            const stats = reliableMessaging.getStats();
            setPendingMessages(pending);
            setRetryStats(stats);
        };

        // Initial update
        updateStatus();

        // Poll every 2 seconds
        const interval = setInterval(updateStatus, 2000);

        return () => clearInterval(interval);
    }, [sessionId]);

    // Don't show if no pending messages
    if (pendingMessages.length === 0) {
        return null;
    }

    const retryingMessages = pendingMessages.filter(msg => msg.status === 'pending' || msg.status === 'sending');
    const failedMessages = pendingMessages.filter(msg => msg.status === 'failed');

    if (retryingMessages.length === 0 && failedMessages.length === 0) {
        return null;
    }

    const getMessage = () => {
        if (retryingMessages.length > 0) {
            return retryingMessages.length === 1
                ? t('message.retrying.single')
                : t('message.retrying.multiple', { count: retryingMessages.length });
        } else if (failedMessages.length > 0) {
            return failedMessages.length === 1
                ? t('message.failed.single')
                : t('message.failed.multiple', { count: failedMessages.length });
        }
        return '';
    };

    const getIcon = () => {
        if (retryingMessages.length > 0) {
            return 'refresh';
        } else if (failedMessages.length > 0) {
            return 'warning';
        }
        return 'information-circle';
    };

    return (
        <View style={styles.container}>
            <Ionicons
                name={getIcon()}
                size={16}
                color={theme.colors.warning}
                style={styles.icon}
            />
            <Text style={styles.text}>
                {getMessage()}
            </Text>
            {retryingMessages.length > 0 && (
                <ActivityIndicator
                    size="small"
                    color={theme.colors.warning}
                    style={styles.spinner}
                />
            )}
        </View>
    );
};

/**
 * Hook to get retry status for a session
 */
export const useMessageRetryStatus = (sessionId: string) => {
    const [status, setStatus] = React.useState({
        pending: 0,
        retrying: 0,
        failed: 0,
        hasIssues: false
    });

    React.useEffect(() => {
        const updateStatus = () => {
            const pending = reliableMessaging.getPendingMessages(sessionId);
            const retrying = pending.filter(msg => msg.status === 'pending' || msg.status === 'sending').length;
            const failed = pending.filter(msg => msg.status === 'failed').length;

            setStatus({
                pending: pending.length,
                retrying,
                failed,
                hasIssues: retrying > 0 || failed > 0
            });
        };

        updateStatus();
        const interval = setInterval(updateStatus, 2000);
        return () => clearInterval(interval);
    }, [sessionId]);

    return status;
};