import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { stopRealtimeSession } from '@/realtime/RealtimeSession';
import { useRealtimeStatus } from '@/sync/storage';
import { StatusDot } from './StatusDot';

interface VoiceAssistantStatusBarProps {
  variant?: 'full' | 'sidebar';
  style?: any;
}

export const VoiceAssistantStatusBar = React.memo(({ variant = 'full', style }: VoiceAssistantStatusBarProps) => {
  const { theme } = useUnistyles();
  const realtimeStatus = useRealtimeStatus();

  // Don't render if disconnected
  if (realtimeStatus === 'disconnected') {
    return null;
  }

  const getStatusInfo = () => {
    switch (realtimeStatus) {
      case 'connecting':
        return {
          color: theme.colors.status.connecting,
          backgroundColor: theme.colors.surfaceHighest,
          isPulsing: true,
          text: 'Connecting...',
          textColor: theme.colors.text,
        };
      case 'connected':
        return {
          color: theme.colors.status.connected,
          backgroundColor: theme.colors.surfaceHighest,
          isPulsing: false,
          text: 'Voice Assistant Active',
          textColor: theme.colors.text,
        };
      case 'error':
        return {
          color: theme.colors.status.error,
          backgroundColor: theme.colors.surfaceHighest,
          isPulsing: false,
          text: 'Connection Error',
          textColor: theme.colors.text,
        };
      default:
        return {
          color: theme.colors.status.default,
          backgroundColor: theme.colors.surfaceHighest,
          isPulsing: false,
          text: 'Voice Assistant',
          textColor: theme.colors.text,
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handlePress = async () => {
    if (realtimeStatus === 'connected' || realtimeStatus === 'connecting') {
      try {
        await stopRealtimeSession();
      } catch (error) {
        console.error('Error stopping voice session:', error);
      }
    }
  };

  if (variant === 'full') {
    // Mobile full-width version
    return (
      <View
        style={{
          backgroundColor: statusInfo.backgroundColor,
          height: 32,
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 16,
        }}
      >
        <Pressable
          onPress={handlePress}
          style={{
            height: 32,
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          hitSlop={10}
        >
          <View style={styles.content}>
            <View style={styles.leftSection}>
              <StatusDot color={statusInfo.color} isPulsing={statusInfo.isPulsing} size={8} style={styles.statusDot} />
              <Ionicons name="mic" size={16} color={statusInfo.textColor} style={styles.micIcon} />
              <Text style={[styles.statusText, { color: statusInfo.textColor }]}>{statusInfo.text}</Text>
            </View>

            <View style={styles.rightSection}>
              <Text style={[styles.tapToEndText, { color: statusInfo.textColor }]}>Tap to end</Text>
            </View>
          </View>
        </Pressable>
      </View>
    );
  }

  // Sidebar version
  const containerStyle = [
    styles.container,
    styles.sidebarContainer,
    {
      backgroundColor: statusInfo.backgroundColor,
    },
    style,
  ];

  return (
    <View style={containerStyle}>
      <Pressable onPress={handlePress} style={styles.pressable} hitSlop={5}>
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <StatusDot color={statusInfo.color} isPulsing={statusInfo.isPulsing} size={8} style={styles.statusDot} />
            <Ionicons name="mic" size={16} color={statusInfo.textColor} style={styles.micIcon} />
            <Text style={[styles.statusText, styles.sidebarStatusText, { color: statusInfo.textColor }]}>
              {statusInfo.text}
            </Text>
          </View>

          <Ionicons name="close" size={14} color={statusInfo.textColor} style={styles.closeIcon} />
        </View>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderRadius: 0,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  fullContainer: {
    justifyContent: 'flex-end',
  },
  sidebarContainer: {},
  pressable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    marginRight: 6,
  },
  micIcon: {
    marginRight: 6,
  },
  closeIcon: {
    marginLeft: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    ...Typography.default(),
  },
  sidebarStatusText: {
    fontSize: 12,
  },
  tapToEndText: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.8,
    ...Typography.default(),
  },
});
