import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/components/StyledText';
import { Typography } from '@/constants/Typography';
import { useNavigateToSession } from '@/hooks/useNavigateToSession';
import { useAllMachines } from '@/sync/storage';
import { Machine, Session } from '@/sync/storageTypes';
import { t } from '@/text';
import { useIsTablet } from '@/utils/responsive';
import { formatPathRelativeToHome, getSessionAvatarId, getSessionName, useSessionStatus } from '@/utils/sessionUtils';
import { Avatar } from './Avatar';
import { ProjectGitStatus } from './ProjectGitStatus';
import { StatusDot } from './StatusDot';

const stylesheet = StyleSheet.create((theme, runtime) => ({
  container: {
    backgroundColor: theme.colors.groupped.background,
    paddingTop: 8,
  },
  projectCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: 8,
    marginHorizontal: Platform.select({ ios: 16, default: 12 }),
    borderRadius: Platform.select({ ios: 10, default: 16 }),
    overflow: 'hidden',
    shadowColor: theme.colors.shadow.color,
    shadowOffset: { width: 0, height: 0.33 },
    shadowOpacity: theme.colors.shadow.opacity,
    shadowRadius: 0,
    elevation: 1,
  },
  sectionHeader: {
    paddingTop: 12,
    paddingBottom: Platform.select({ ios: 6, default: 8 }),
    paddingHorizontal: Platform.select({ ios: 32, default: 24 }),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  sectionHeaderAvatar: {
    marginRight: 8,
  },
  sectionHeaderPath: {
    ...Typography.default('regular'),
    color: theme.colors.groupped.sectionTitle,
    fontSize: Platform.select({ ios: 13, default: 14 }),
    lineHeight: Platform.select({ ios: 18, default: 20 }),
    letterSpacing: Platform.select({ ios: -0.08, default: 0.1 }),
    fontWeight: Platform.select({ ios: 'normal', default: '500' }),
    flex: 1,
  },
  sessionRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
  },
  sessionRowWithBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  sessionRowSelected: {
    backgroundColor: theme.colors.surfaceSelected,
  },
  sessionContent: {
    flex: 1,
    justifyContent: 'center',
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionTitle: {
    fontSize: 15,
    flex: 1,
    ...Typography.default('regular'),
  },
  sessionTitleConnected: {
    color: theme.colors.text,
  },
  sessionTitleDisconnected: {
    color: theme.colors.textSecondary,
  },
  statusDotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    height: 16,
  },
  newSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 56,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
  },
  newSessionButtonDisabled: {
    opacity: 0.4,
  },
  newSessionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newSessionButtonIcon: {
    marginRight: 8,
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newSessionButtonText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    ...Typography.default('regular'),
  },
}));

interface ActiveSessionsGroupProps {
  sessions: Session[];
  selectedSessionId?: string;
}

export function ActiveSessionsGroupCompact({ sessions, selectedSessionId }: ActiveSessionsGroupProps) {
  const styles = stylesheet;
  const machines = useAllMachines();

  const machinesMap = React.useMemo(() => {
    const map: Record<string, Machine> = {};
    machines.forEach(machine => {
      map[machine.id] = machine;
    });
    return map;
  }, [machines]);

  // Group sessions by project, then associate with machine
  const projectGroups = React.useMemo(() => {
    const groups = new Map<
      string,
      {
        path: string;
        displayPath: string;
        machines: Map<
          string,
          {
            machine: Machine | null;
            machineName: string;
            sessions: Session[];
          }
        >;
      }
    >();

    sessions.forEach(session => {
      const projectPath = session.metadata?.path || '';
      const unknownText = t('status.unknown');
      const machineId = session.metadata?.machineId || unknownText;

      // Get machine info
      const machine = machineId !== unknownText ? machinesMap[machineId] : null;
      const machineName =
        machine?.metadata?.displayName ||
        machine?.metadata?.host ||
        (machineId !== unknownText ? machineId : `<${unknownText}>`);

      // Get or create project group
      let projectGroup = groups.get(projectPath);
      if (!projectGroup) {
        const displayPath = formatPathRelativeToHome(projectPath, session.metadata?.homeDir);
        projectGroup = {
          path: projectPath,
          displayPath,
          machines: new Map(),
        };
        groups.set(projectPath, projectGroup);
      }

      // Get or create machine group within project
      let machineGroup = projectGroup.machines.get(machineId);
      if (!machineGroup) {
        machineGroup = {
          machine,
          machineName,
          sessions: [],
        };
        projectGroup.machines.set(machineId, machineGroup);
      }

      // Add session to machine group
      machineGroup.sessions.push(session);
    });

    // Sort sessions within each machine group by creation time (newest first)
    groups.forEach(projectGroup => {
      projectGroup.machines.forEach(machineGroup => {
        machineGroup.sessions.sort((a, b) => b.createdAt - a.createdAt);
      });
    });

    return groups;
  }, [sessions, machinesMap]);

  // Sort project groups by display path
  const sortedProjectGroups = React.useMemo(() => {
    return Array.from(projectGroups.entries()).sort(([, groupA], [, groupB]) => {
      return groupA.displayPath.localeCompare(groupB.displayPath);
    });
  }, [projectGroups]);

  return (
    <View style={styles.container}>
      {sortedProjectGroups.map(([projectPath, projectGroup]) => {
        // Get the avatar ID from the first session
        const firstSession = Array.from(projectGroup.machines.values())[0]?.sessions[0];
        const avatarId = firstSession ? getSessionAvatarId(firstSession) : undefined;

        return (
          <View key={projectPath}>
            {/* Section header on grouped background */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                {avatarId && (
                  <View style={styles.sectionHeaderAvatar}>
                    <Avatar id={avatarId} size={24} flavor={firstSession?.metadata?.flavor} />
                  </View>
                )}
                <Text style={styles.sectionHeaderPath}>{projectGroup.displayPath}</Text>
              </View>
              {/* Show git status instead of machine name */}
              {firstSession ? <ProjectGitStatus sessionId={firstSession.id} /> : null}
            </View>

            {/* Card with just the sessions */}
            <View style={styles.projectCard}>
              {/* Sessions grouped by machine within the card */}
              {Array.from(projectGroup.machines.entries())
                .sort(([, machineA], [, machineB]) => machineA.machineName.localeCompare(machineB.machineName))
                .map(([machineId, machineGroup]) => (
                  <View key={`${projectPath}-${machineId}`}>
                    {machineGroup.sessions.map((session, index) => (
                      <CompactSessionRow
                        key={session.id}
                        session={session}
                        selected={selectedSessionId === session.id}
                        showBorder={
                          index < machineGroup.sessions.length - 1 ||
                          Array.from(projectGroup.machines.keys()).indexOf(machineId) < projectGroup.machines.size - 1
                        }
                      />
                    ))}
                  </View>
                ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Compact session row component with status line
const CompactSessionRow = React.memo(
  ({ session, selected, showBorder }: { session: Session; selected?: boolean; showBorder?: boolean }) => {
    const styles = stylesheet;
    const { theme } = useUnistyles();
    const sessionStatus = useSessionStatus(session);
    const sessionName = getSessionName(session);
    const navigateToSession = useNavigateToSession();
    const isTablet = useIsTablet();

    return (
      <Pressable
        style={[styles.sessionRow, showBorder && styles.sessionRowWithBorder, selected && styles.sessionRowSelected]}
        onPressIn={() => {
          if (isTablet) {
            navigateToSession(session.id);
          }
        }}
        onPress={() => {
          if (!isTablet) {
            navigateToSession(session.id);
          }
        }}
      >
        <View style={styles.sessionContent}>
          {/* Title line with status */}
          <View style={styles.sessionTitleRow}>
            {/* Status dot or draft icon on the left */}
            {(() => {
              // Show draft icon when online with draft
              if (sessionStatus.state === 'waiting' && session.draft) {
                return (
                  <Ionicons
                    name="create-outline"
                    size={14}
                    color={theme.colors.textSecondary}
                    style={{ marginRight: 8 }}
                  />
                );
              }

              // Show status dot only for permission_required/thinking states
              if (sessionStatus.state === 'permission_required' || sessionStatus.state === 'thinking') {
                return (
                  <View style={[styles.statusDotContainer, { marginRight: 8 }]}>
                    <StatusDot color={sessionStatus.statusDotColor} isPulsing={sessionStatus.isPulsing} />
                  </View>
                );
              }

              // Show grey dot for online without draft
              if (sessionStatus.state === 'waiting') {
                return (
                  <View style={[styles.statusDotContainer, { marginRight: 8 }]}>
                    <StatusDot color={theme.colors.textSecondary} isPulsing={false} />
                  </View>
                );
              }

              return null;
            })()}

            <Text
              style={[
                styles.sessionTitle,
                sessionStatus.isConnected ? styles.sessionTitleConnected : styles.sessionTitleDisconnected,
              ]}
              numberOfLines={2}
            >
              {sessionName}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }
);
