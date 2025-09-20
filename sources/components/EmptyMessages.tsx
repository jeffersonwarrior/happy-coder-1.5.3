import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Typography } from '@/constants/Typography';
import { Session } from '@/sync/storageTypes';
import { t } from '@/text';
import { useSessionStatus, formatPathRelativeToHome } from '@/utils/sessionUtils';

const stylesheet = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  iconContainer: {
    marginBottom: 12,
  },
  hostText: {
    fontSize: 18,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
    ...Typography.default('semiBold'),
  },
  pathText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    ...Typography.default('regular'),
  },
  noMessagesText: {
    fontSize: 20,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    ...Typography.default('regular'),
  },
  createdText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    ...Typography.default(),
  },
}));

interface EmptyMessagesProps {
    session: Session;
}

function getOSIcon(os?: string): keyof typeof Ionicons.glyphMap {
  if (!os) return 'hardware-chip-outline';
    
  const osLower = os.toLowerCase();
  if (osLower.includes('darwin') || osLower.includes('mac')) {
    return 'laptop-outline';
  } else if (osLower.includes('win')) {
    return 'desktop-outline';
  } else if (osLower.includes('linux')) {
    return 'terminal-outline';
  }
  return 'hardware-chip-outline';
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
    
  if (diffMinutes < 1) {
    return t('time.justNow');
  } else if (diffMinutes < 60) {
    return t('time.minutesAgo', { count: diffMinutes });
  } else if (diffHours < 24) {
    return t('time.hoursAgo', { count: diffHours });
  } else {
    return t('sessionHistory.daysAgo', { count: diffDays });
  }
}

export function EmptyMessages({ session }: EmptyMessagesProps) {
  const { theme } = useUnistyles();
  const styles = stylesheet;
  const osIcon = getOSIcon(session.metadata?.os);
  const sessionStatus = useSessionStatus(session);
  const startedTime = formatRelativeTime(session.createdAt);
    
  return (
    <View style={styles.container}>
      <Ionicons 
        name={osIcon}
        size={72} 
        color={theme.colors.textSecondary}
        style={styles.iconContainer}
      />
            
      {session.metadata?.host && (
        <Text style={styles.hostText}>
          {session.metadata.host}
        </Text>
      )}
            
      {session.metadata?.path && (
        <Text style={styles.pathText}>
          {formatPathRelativeToHome(session.metadata.path, session.metadata.homeDir)}
        </Text>
      )}
            
      <Text style={styles.noMessagesText}>
                No messages yet
      </Text>
            
      <Text style={styles.createdText}>
                Created {startedTime}
      </Text>
    </View>
  );
}