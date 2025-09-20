import React from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { DecryptedArtifact } from './artifactTypes';
import { LocalSettings, applyLocalSettings } from './localSettings';
import { loadSettings, loadLocalSettings, saveLocalSettings, saveSettings, loadPurchases, savePurchases, loadProfile, saveProfile, loadSessionDrafts, saveSessionDrafts, loadSessionPermissionModes, saveSessionPermissionModes } from './persistence';
import { Profile } from './profile';
import { projectManager } from './projectManager';
import { Purchases, customerInfoToPurchases } from './purchases';
import { createReducer, reducer, ReducerState } from './reducer/reducer';
import { applySettings, Settings } from './settings';
import { Session, Machine, GitStatus } from './storageTypes';
import { sync } from './sync';
import { Message } from './typesMessage';
import { NormalizedMessage } from './typesRaw';

import type { CustomerInfo } from './revenueCat/types';
import type { PermissionMode } from '@/components/PermissionModeSelector';

import { isMutableTool } from '@/components/tools/knownTools';
import { getCurrentRealtimeSessionId, getVoiceSession } from '@/realtime/RealtimeSession';
import { isMachineOnline } from '@/utils/machineUtils';





/**
 * Centralized session online state resolver
 * Returns either "online" (string) or a timestamp (number) for last seen
 */
function resolveSessionOnlineState(session: { active: boolean; activeAt: number }): 'online' | number {
  // Session is online if the active flag is true
  return session.active ? 'online' : session.activeAt;
}

/**
 * Checks if a session should be shown in the active sessions group
 */
function isSessionActive(session: { active: boolean; activeAt: number }): boolean {
  // Use the active flag directly, no timeout checks
  return session.active;
}

// Known entitlement IDs
export type KnownEntitlements = 'pro';

interface SessionMessages {
    messages: Message[];
    messagesMap: Record<string, Message>;
    reducerState: ReducerState;
    isLoaded: boolean;
}

// Machine type is now imported from storageTypes - represents persisted machine data

// Unified list item type for SessionsList component
export type SessionListViewItem =
    | { type: 'header'; title: string }
    | { type: 'active-sessions'; sessions: Session[] }
    | { type: 'project-group'; displayPath: string; machine: Machine }
    | { type: 'session'; session: Session; variant?: 'default' | 'no-path' };

// Legacy type for backward compatibility - to be removed
export type SessionListItem = string | Session;

interface StorageState {
    settings: Settings;
    settingsVersion: number | null;
    localSettings: LocalSettings;
    purchases: Purchases;
    profile: Profile;
    sessions: Record<string, Session>;
    sessionsData: SessionListItem[] | null;  // Legacy - to be removed
    sessionListViewData: SessionListViewItem[] | null;
    sessionMessages: Record<string, SessionMessages>;
    sessionGitStatus: Record<string, GitStatus | null>;
    machines: Record<string, Machine>;
    artifacts: Record<string, DecryptedArtifact>;
    realtimeStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
    socketStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
    socketLastConnectedAt: number | null;
    socketLastDisconnectedAt: number | null;
    isDataReady: boolean;
    nativeUpdateStatus: { available: boolean; updateUrl?: string } | null;
    applySessions: (sessions: (Omit<Session, 'presence'> & { presence?: 'online' | number })[]) => void;
    applyMachines: (machines: Machine[], replace?: boolean) => void;
    applyLoaded: () => void;
    applyReady: () => void;
    applyMessages: (sessionId: string, messages: NormalizedMessage[]) => { changed: string[], hasReadyEvent: boolean };
    applyMessagesLoaded: (sessionId: string) => void;
    clearSessionMessages: (sessionId: string) => void;
    removeSession: (sessionId: string) => void;
    updateSession: (sessionId: string, session: Session) => void;
    compactStorage?: () => Promise<void>;
    applySettings: (settings: Settings, version: number) => void;
    applySettingsLocal: (settings: Partial<Settings>) => void;
    applyLocalSettings: (settings: Partial<LocalSettings>) => void;
    applyPurchases: (customerInfo: CustomerInfo) => void;
    applyProfile: (profile: Profile) => void;
    applyGitStatus: (sessionId: string, status: GitStatus | null) => void;
    applyNativeUpdateStatus: (status: { available: boolean; updateUrl?: string } | null) => void;
    isMutableToolCall: (sessionId: string, callId: string) => boolean;
    setRealtimeStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
    setSocketStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
    getActiveSessions: () => Session[];
    updateSessionDraft: (sessionId: string, draft: string | null) => void;
    updateSessionPermissionMode: (sessionId: string, mode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'read-only' | 'safe-yolo' | 'yolo') => void;
    updateSessionModelMode: (sessionId: string, mode: 'default' | 'adaptiveUsage' | 'sonnet' | 'opus' | 'gpt-5-minimal' | 'gpt-5-low' | 'gpt-5-medium' | 'gpt-5-high') => void;
    // Project management methods
    getProjects: () => import('./projectManager').Project[];
    getProject: (projectId: string) => import('./projectManager').Project | null;
    getProjectForSession: (sessionId: string) => import('./projectManager').Project | null;
    getProjectSessions: (projectId: string) => string[];
    // Project git status methods
    getProjectGitStatus: (projectId: string) => import('./storageTypes').GitStatus | null;
    getSessionProjectGitStatus: (sessionId: string) => import('./storageTypes').GitStatus | null;
    updateSessionProjectGitStatus: (sessionId: string, status: import('./storageTypes').GitStatus | null) => void;
    // Artifacts management methods
    applyArtifacts: (artifacts: DecryptedArtifact[]) => void;
    updateArtifact: (artifact: DecryptedArtifact) => void;
    deleteArtifact: (artifactId: string) => void;
}

// Helper function to build unified list view data from sessions and machines
function buildSessionListViewData(
  sessions: Record<string, Session>,
): SessionListViewItem[] {
  // Separate active and inactive sessions
  const activeSessions: Session[] = [];
  const inactiveSessions: Session[] = [];

  Object.values(sessions).forEach(session => {
    if (isSessionActive(session)) {
      activeSessions.push(session);
    } else {
      inactiveSessions.push(session);
    }
  });

  // Sort sessions by updated date (newest first)
  activeSessions.sort((a, b) => b.updatedAt - a.updatedAt);
  inactiveSessions.sort((a, b) => b.updatedAt - a.updatedAt);

  // Build unified list view data
  const listData: SessionListViewItem[] = [];

  // Add active sessions as a single item at the top (if any)
  if (activeSessions.length > 0) {
    listData.push({ type: 'active-sessions', sessions: activeSessions });
  }

  // Group inactive sessions by date
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  let currentDateGroup: Session[] = [];
  let currentDateString: string | null = null;

  for (const session of inactiveSessions) {
    const sessionDate = new Date(session.updatedAt);
    const dateString = sessionDate.toDateString();

    if (currentDateString !== dateString) {
      // Process previous group
      if (currentDateGroup.length > 0 && currentDateString) {
        const groupDate = new Date(currentDateString);
        const sessionDateOnly = new Date(groupDate.getFullYear(), groupDate.getMonth(), groupDate.getDate());

        let headerTitle: string;
        if (sessionDateOnly.getTime() === today.getTime()) {
          headerTitle = 'Today';
        } else if (sessionDateOnly.getTime() === yesterday.getTime()) {
          headerTitle = 'Yesterday';
        } else {
          const diffTime = today.getTime() - sessionDateOnly.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          headerTitle = `${diffDays} days ago`;
        }

        listData.push({ type: 'header', title: headerTitle });
        currentDateGroup.forEach(sess => {
          listData.push({ type: 'session', session: sess });
        });
      }

      // Start new group
      currentDateString = dateString;
      currentDateGroup = [session];
    } else {
      currentDateGroup.push(session);
    }
  }

  // Process final group
  if (currentDateGroup.length > 0 && currentDateString) {
    const groupDate = new Date(currentDateString);
    const sessionDateOnly = new Date(groupDate.getFullYear(), groupDate.getMonth(), groupDate.getDate());

    let headerTitle: string;
    if (sessionDateOnly.getTime() === today.getTime()) {
      headerTitle = 'Today';
    } else if (sessionDateOnly.getTime() === yesterday.getTime()) {
      headerTitle = 'Yesterday';
    } else {
      const diffTime = today.getTime() - sessionDateOnly.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      headerTitle = `${diffDays} days ago`;
    }

    listData.push({ type: 'header', title: headerTitle });
    currentDateGroup.forEach(sess => {
      listData.push({ type: 'session', session: sess });
    });
  }

  return listData;
}

export const storage = create<StorageState>()((set, get) => {
  const { settings, version } = loadSettings();
  const localSettings = loadLocalSettings();
  const purchases = loadPurchases();
  const profile = loadProfile();
  const sessionDrafts = loadSessionDrafts();
  const sessionPermissionModes = loadSessionPermissionModes();
  return {
    settings,
    settingsVersion: version,
    localSettings,
    purchases,
    profile,
    sessions: {},
    machines: {},
    artifacts: {},
    sessionsData: null,  // Legacy - to be removed
    sessionListViewData: null,
    sessionMessages: {},
    sessionGitStatus: {},
    realtimeStatus: 'disconnected',
    socketStatus: 'disconnected',
    socketLastConnectedAt: null,
    socketLastDisconnectedAt: null,
    isDataReady: false,
    nativeUpdateStatus: null,
    isMutableToolCall: (sessionId: string, callId: string) => {
      const sessionMessages = get().sessionMessages[sessionId];
      if (!sessionMessages) {
        return true;
      }
      const toolCall = sessionMessages.reducerState.toolIdToMessageId.get(callId);
      if (!toolCall) {
        return true;
      }
      const toolCallMessage = sessionMessages.messagesMap[toolCall];
      if (!toolCallMessage || toolCallMessage.kind !== 'tool-call') {
        return true;
      }
      return toolCallMessage.tool?.name ? isMutableTool(toolCallMessage.tool?.name) : true;
    },
    getActiveSessions: () => {
      const state = get();
      return Object.values(state.sessions).filter(s => s.active);
    },
    applySessions: (sessions: (Omit<Session, 'presence'> & { presence?: 'online' | number })[]) => set((state) => {
      // Load drafts and permission modes if sessions are empty (initial load)
      const savedDrafts = Object.keys(state.sessions).length === 0 ? sessionDrafts : {};
      const savedPermissionModes = Object.keys(state.sessions).length === 0 ? sessionPermissionModes : {};

      // Merge new sessions with existing ones
      const mergedSessions: Record<string, Session> = { ...state.sessions };

      // Update sessions with calculated presence using centralized resolver
      sessions.forEach(session => {
        // Use centralized resolver for consistent state management
        const presence = resolveSessionOnlineState(session);

        // Preserve existing draft and permission mode if they exist, or load from saved data
        const existingDraft = state.sessions[session.id]?.draft;
        const savedDraft = savedDrafts[session.id];
        const existingPermissionMode = state.sessions[session.id]?.permissionMode;
        const savedPermissionMode = savedPermissionModes[session.id];
        mergedSessions[session.id] = {
          ...session,
          presence,
          draft: existingDraft || savedDraft || session.draft || null,
          permissionMode: existingPermissionMode || savedPermissionMode || session.permissionMode || 'default',
        };
      });

      // Build active set from all sessions (including existing ones)
      const activeSet = new Set<string>();
      Object.values(mergedSessions).forEach(session => {
        if (isSessionActive(session)) {
          activeSet.add(session.id);
        }
      });

      // Separate active and inactive sessions
      const activeSessions: Session[] = [];
      const inactiveSessions: Session[] = [];

      // Process all sessions from merged set
      Object.values(mergedSessions).forEach(session => {
        if (activeSet.has(session.id)) {
          activeSessions.push(session);
        } else {
          inactiveSessions.push(session);
        }
      });

      // Sort both arrays by creation date for stable ordering
      activeSessions.sort((a, b) => b.createdAt - a.createdAt);
      inactiveSessions.sort((a, b) => b.createdAt - a.createdAt);

      // Build flat list data for FlashList (legacy)
      const listData: SessionListItem[] = [];

      if (activeSessions.length > 0) {
        listData.push('online');
        listData.push(...activeSessions);
      }

      // Legacy sessionsData - to be removed
      // Machines are now integrated into sessionListViewData

      if (inactiveSessions.length > 0) {
        listData.push('offline');
        listData.push(...inactiveSessions);
      }

      // console.log(`📊 Storage: applySessions called with ${sessions.length} sessions, active: ${activeSessions.length}, inactive: ${inactiveSessions.length}`);

      // Process AgentState updates for sessions that already have messages loaded
      const updatedSessionMessages = { ...state.sessionMessages };

      sessions.forEach(session => {
        const oldSession = state.sessions[session.id];
        const newSession = mergedSessions[session.id];

        // Check if sessionMessages exists AND agentStateVersion is newer
        const existingSessionMessages = updatedSessionMessages[session.id];
        if (existingSessionMessages && newSession.agentState &&
                    (!oldSession || newSession.agentStateVersion > (oldSession.agentStateVersion || 0))) {

          // Check for NEW permission requests before processing
          const currentRealtimeSessionId = getCurrentRealtimeSessionId();
          const voiceSession = getVoiceSession();

          // console.log('[REALTIME DEBUG] Permission check:', {
          //     currentRealtimeSessionId,
          //     sessionId: session.id,
          //     match: currentRealtimeSessionId === session.id,
          //     hasVoiceSession: !!voiceSession,
          //     oldRequests: Object.keys(oldSession?.agentState?.requests || {}),
          //     newRequests: Object.keys(newSession.agentState?.requests || {})
          // });

          if (currentRealtimeSessionId === session.id && voiceSession) {
            const oldRequests = oldSession?.agentState?.requests || {};
            const newRequests = newSession.agentState?.requests || {};

            // Find NEW permission requests only
            for (const [requestId, request] of Object.entries(newRequests)) {
              if (!oldRequests[requestId]) {
                // This is a NEW permission request
                const toolName = request.tool;
                // console.log('[REALTIME DEBUG] Sending permission notification for:', toolName);
                voiceSession.sendTextMessage(
                  `Claude is requesting permission to use the ${toolName} tool`,
                );
              }
            }
          }

          // Process new AgentState through reducer
          const reducerResult = reducer(existingSessionMessages.reducerState, [], newSession.agentState);
          const processedMessages = reducerResult.messages;

          // Always update the session messages, even if no new messages were created
          // This ensures the reducer state is updated with the new AgentState
          const mergedMessagesMap = { ...existingSessionMessages.messagesMap };
          processedMessages.forEach(message => {
            mergedMessagesMap[message.id] = message;
          });

          const messagesArray = Object.values(mergedMessagesMap)
            .sort((a, b) => b.createdAt - a.createdAt);

          updatedSessionMessages[session.id] = {
            messages: messagesArray,
            messagesMap: mergedMessagesMap,
            reducerState: existingSessionMessages.reducerState, // The reducer modifies state in-place, so this has the updates
            isLoaded: existingSessionMessages.isLoaded,
          };

          // IMPORTANT: Copy latestUsage from reducerState to Session for immediate availability
          if (existingSessionMessages.reducerState.latestUsage) {
            mergedSessions[session.id] = {
              ...mergedSessions[session.id],
              latestUsage: { ...existingSessionMessages.reducerState.latestUsage },
            };
          }
        }
      });

      // Build new unified list view data
      const sessionListViewData = buildSessionListViewData(
        mergedSessions,
      );

      // Update project manager with current sessions and machines
      const machineMetadataMap = new Map<string, any>();
      Object.values(state.machines).forEach(machine => {
        if (machine.metadata) {
          machineMetadataMap.set(machine.id, machine.metadata);
        }
      });
      projectManager.updateSessions(Object.values(mergedSessions), machineMetadataMap);

      return {
        ...state,
        sessions: mergedSessions,
        sessionsData: listData,  // Legacy - to be removed
        sessionListViewData,
        sessionMessages: updatedSessionMessages,
      };
    }),
    applyLoaded: () => set((state) => {
      const result = {
        ...state,
        sessionsData: [],
      };
      return result;
    }),
    applyReady: () => set((state) => ({
      ...state,
      isDataReady: true,
    })),
    applyMessages: (sessionId: string, messages: NormalizedMessage[]) => {
      const changed = new Set<string>();
      let hasReadyEvent = false;
      set((state) => {

        // Resolve session messages state
        const existingSession = state.sessionMessages[sessionId] || {
          messages: [],
          messagesMap: {},
          reducerState: createReducer(),
          isLoaded: false,
        };

        // Get the session's agentState if available
        const session = state.sessions[sessionId];
        const agentState = session?.agentState;

        // Messages are already normalized, no need to process them again
        const normalizedMessages = messages;

        // Run reducer with agentState
        const reducerResult = reducer(existingSession.reducerState, normalizedMessages, agentState);
        const processedMessages = reducerResult.messages;
        for (const message of processedMessages) {
          changed.add(message.id);
        }
        if (reducerResult.hasReadyEvent) {
          hasReadyEvent = true;
        }

        // Merge messages
        const mergedMessagesMap = { ...existingSession.messagesMap };
        processedMessages.forEach(message => {
          mergedMessagesMap[message.id] = message;
        });

        // Convert to array and sort by createdAt
        const messagesArray = Object.values(mergedMessagesMap)
          .sort((a, b) => b.createdAt - a.createdAt);

        // Update session with todos and latestUsage
        // IMPORTANT: We extract latestUsage from the mutable reducerState and copy it to the Session object
        // This ensures latestUsage is available immediately on load, even before messages are fully loaded
        let updatedSessions = state.sessions;
        const needsUpdate = (reducerResult.todos !== undefined || existingSession.reducerState.latestUsage) && session;

        if (needsUpdate) {
          updatedSessions = {
            ...state.sessions,
            [sessionId]: {
              ...session,
              ...(reducerResult.todos !== undefined && { todos: reducerResult.todos }),
              // Copy latestUsage from reducerState to make it immediately available
              latestUsage: existingSession.reducerState.latestUsage ? {
                ...existingSession.reducerState.latestUsage,
              } : session.latestUsage,
            },
          };
        }

        return {
          ...state,
          sessions: updatedSessions,
          sessionMessages: {
            ...state.sessionMessages,
            [sessionId]: {
              ...existingSession,
              messages: messagesArray,
              messagesMap: mergedMessagesMap,
              reducerState: existingSession.reducerState, // Explicitly include the mutated reducer state
              isLoaded: true,
            },
          },
        };
      });

      return { changed: Array.from(changed), hasReadyEvent };
    },
    applyMessagesLoaded: (sessionId: string) => set((state) => {
      const existingSession = state.sessionMessages[sessionId];
      let result: StorageState;

      if (!existingSession) {
        // First time loading - check for AgentState
        const session = state.sessions[sessionId];
        const agentState = session?.agentState;

        // Create new reducer state
        const reducerState = createReducer();

        // Process AgentState if it exists
        let messages: Message[] = [];
        const messagesMap: Record<string, Message> = {};

        if (agentState) {
          // Process AgentState through reducer to get initial permission messages
          const reducerResult = reducer(reducerState, [], agentState);
          const processedMessages = reducerResult.messages;

          processedMessages.forEach(message => {
            messagesMap[message.id] = message;
          });

          messages = Object.values(messagesMap)
            .sort((a, b) => b.createdAt - a.createdAt);
        }

        // Extract latestUsage from reducerState if available and update session
        let updatedSessions = state.sessions;
        if (session && reducerState.latestUsage) {
          updatedSessions = {
            ...state.sessions,
            [sessionId]: {
              ...session,
              latestUsage: { ...reducerState.latestUsage },
            },
          };
        }

        result = {
          ...state,
          sessions: updatedSessions,
          sessionMessages: {
            ...state.sessionMessages,
            [sessionId]: {
              reducerState,
              messages,
              messagesMap,
              isLoaded: true,
            } satisfies SessionMessages,
          },
        };
      } else {
        result = {
          ...state,
          sessionMessages: {
            ...state.sessionMessages,
            [sessionId]: {
              ...existingSession,
              isLoaded: true,
            } satisfies SessionMessages,
          },
        };
      }

      return result;
    }),
    applySettingsLocal: (settings: Partial<Settings>) => set((state) => {
      saveSettings(applySettings(state.settings, settings), state.settingsVersion ?? 0);
      return {
        ...state,
        settings: applySettings(state.settings, settings),
      };
    }),
    applySettings: (settings: Settings, version: number) => set((state) => {
      if (state.settingsVersion === null || state.settingsVersion < version) {
        saveSettings(settings, version);
        return {
          ...state,
          settings,
          settingsVersion: version,
        };
      } else {
        return state;
      }
    }),
    applyLocalSettings: (delta: Partial<LocalSettings>) => set((state) => {
      const updatedLocalSettings = applyLocalSettings(state.localSettings, delta);
      saveLocalSettings(updatedLocalSettings);
      return {
        ...state,
        localSettings: updatedLocalSettings,
      };
    }),
    applyPurchases: (customerInfo: CustomerInfo) => set((state) => {
      // Transform CustomerInfo to our Purchases format
      const purchases = customerInfoToPurchases(customerInfo);

      // Always save and update - no need for version checks
      savePurchases(purchases);
      return {
        ...state,
        purchases,
      };
    }),
    applyProfile: (profile: Profile) => set((state) => {
      // Always save and update profile
      saveProfile(profile);
      return {
        ...state,
        profile,
      };
    }),
    applyGitStatus: (sessionId: string, status: GitStatus | null) => set((state) => {
      // Update project git status as well
      projectManager.updateSessionProjectGitStatus(sessionId, status);

      return {
        ...state,
        sessionGitStatus: {
          ...state.sessionGitStatus,
          [sessionId]: status,
        },
      };
    }),
    applyNativeUpdateStatus: (status: { available: boolean; updateUrl?: string } | null) => set((state) => ({
      ...state,
      nativeUpdateStatus: status,
    })),
    setRealtimeStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => set((state) => ({
      ...state,
      realtimeStatus: status,
    })),
    setSocketStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => set((state) => {
      const now = Date.now();
      const updates: Partial<StorageState> = {
        socketStatus: status,
      };

      // Update timestamp based on status
      if (status === 'connected') {
        updates.socketLastConnectedAt = now;
      } else if (status === 'disconnected' || status === 'error') {
        updates.socketLastDisconnectedAt = now;
      }

      return {
        ...state,
        ...updates,
      };
    }),
    updateSessionDraft: (sessionId: string, draft: string | null) => set((state) => {
      const session = state.sessions[sessionId];
      if (!session) return state;

      // Don't store empty strings, convert to null
      const normalizedDraft = draft?.trim() ? draft : null;

      // Collect all drafts for persistence
      const allDrafts: Record<string, string> = {};
      Object.entries(state.sessions).forEach(([id, sess]) => {
        if (id === sessionId) {
          if (normalizedDraft) {
            allDrafts[id] = normalizedDraft;
          }
        } else if (sess.draft) {
          allDrafts[id] = sess.draft;
        }
      });

      // Persist drafts
      saveSessionDrafts(allDrafts);

      const updatedSessions = {
        ...state.sessions,
        [sessionId]: {
          ...session,
          draft: normalizedDraft,
        },
      };

      // Rebuild sessionListViewData to update the UI immediately
      const sessionListViewData = buildSessionListViewData(
        updatedSessions,
      );

      return {
        ...state,
        sessions: updatedSessions,
        sessionListViewData,
      };
    }),
    updateSessionPermissionMode: (sessionId: string, mode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'read-only' | 'safe-yolo' | 'yolo') => set((state) => {
      const session = state.sessions[sessionId];
      if (!session) return state;

      // Update the session with the new permission mode
      const updatedSessions = {
        ...state.sessions,
        [sessionId]: {
          ...session,
          permissionMode: mode,
        },
      };

      // Collect all permission modes for persistence
      const allModes: Record<string, PermissionMode> = {};
      Object.entries(updatedSessions).forEach(([id, sess]) => {
        if (sess.permissionMode && sess.permissionMode !== 'default') {
          allModes[id] = sess.permissionMode;
        }
      });

      // Persist permission modes (only non-default values to save space)
      saveSessionPermissionModes(allModes);

      // No need to rebuild sessionListViewData since permission mode doesn't affect the list display
      return {
        ...state,
        sessions: updatedSessions,
      };
    }),
    updateSessionModelMode: (sessionId: string, mode: 'default' | 'adaptiveUsage' | 'sonnet' | 'opus' | 'gpt-5-minimal' | 'gpt-5-low' | 'gpt-5-medium' | 'gpt-5-high') => set((state) => {
      const session = state.sessions[sessionId];
      if (!session) return state;

      // Update the session with the new model mode
      const updatedSessions = {
        ...state.sessions,
        [sessionId]: {
          ...session,
          modelMode: mode,
        },
      };

      // No need to rebuild sessionListViewData since model mode doesn't affect the list display
      return {
        ...state,
        sessions: updatedSessions,
      };
    }),
    // Project management methods
    getProjects: () => projectManager.getProjects(),
    getProject: (projectId: string) => projectManager.getProject(projectId),
    getProjectForSession: (sessionId: string) => projectManager.getProjectForSession(sessionId),
    getProjectSessions: (projectId: string) => projectManager.getProjectSessions(projectId),
    // Project git status methods
    getProjectGitStatus: (projectId: string) => projectManager.getProjectGitStatus(projectId),
    getSessionProjectGitStatus: (sessionId: string) => projectManager.getSessionProjectGitStatus(sessionId),
    updateSessionProjectGitStatus: (sessionId: string, status: GitStatus | null) => {
      projectManager.updateSessionProjectGitStatus(sessionId, status);
      // Trigger a state update to notify hooks
      set((state) => ({ ...state }));
    },
    applyMachines: (machines: Machine[], replace: boolean = false) => set((state) => {
      // Either replace all machines or merge updates
      let mergedMachines: Record<string, Machine>;

      if (replace) {
        // Replace entire machine state (used by fetchMachines)
        mergedMachines = {};
        machines.forEach(machine => {
          mergedMachines[machine.id] = machine;
        });
      } else {
        // Merge individual updates (used by update-machine)
        mergedMachines = { ...state.machines };
        machines.forEach(machine => {
          mergedMachines[machine.id] = machine;
        });
      }

      // Rebuild sessionListViewData to reflect machine changes
      const sessionListViewData = buildSessionListViewData(
        state.sessions,
      );

      return {
        ...state,
        machines: mergedMachines,
        sessionListViewData,
      };
    }),

    // Session cleanup and management methods
    clearSessionMessages: (sessionId: string) => set((state) => {
      const updatedSessionMessages = { ...state.sessionMessages };
      delete updatedSessionMessages[sessionId];

      return {
        ...state,
        sessionMessages: updatedSessionMessages,
      };
    }),

    removeSession: (sessionId: string) => set((state) => {
      const updatedSessions = { ...state.sessions };
      delete updatedSessions[sessionId];

      const updatedSessionMessages = { ...state.sessionMessages };
      delete updatedSessionMessages[sessionId];

      // Rebuild session list data using proper function
      const sessionListViewData = buildSessionListViewData(updatedSessions);

      return {
        ...state,
        sessions: updatedSessions,
        sessionMessages: updatedSessionMessages,
        sessionListViewData,
        sessionsData: null,  // Legacy - clear it
      };
    }),

    updateSession: (sessionId: string, session: Session) => set((state) => {
      const updatedSessions = {
        ...state.sessions,
        [sessionId]: session,
      };

      // Rebuild session list data using proper function
      const sessionListViewData = buildSessionListViewData(updatedSessions);

      return {
        ...state,
        sessions: updatedSessions,
        sessionListViewData,
        sessionsData: null,  // Legacy - clear it
      };
    }),

    compactStorage: async () => {
      // This is a placeholder for storage compaction functionality
      // Could be expanded to include cache cleanup, unused data removal, etc.
      console.log('🗜️ Storage: Compacting storage (placeholder)');
    },

    // Artifacts management methods
    applyArtifacts: (artifacts: DecryptedArtifact[]) => set((state) => {
      const artifactsMap: Record<string, DecryptedArtifact> = {};
      artifacts.forEach(artifact => {
        artifactsMap[artifact.id] = artifact;
      });

      return {
        ...state,
        artifacts: artifactsMap,
      };
    }),

    updateArtifact: (artifact: DecryptedArtifact) => set((state) => ({
      ...state,
      artifacts: {
        ...state.artifacts,
        [artifact.id]: artifact,
      },
    })),

    deleteArtifact: (artifactId: string) => set((state) => {
      const updatedArtifacts = { ...state.artifacts };
      delete updatedArtifacts[artifactId];

      return {
        ...state,
        artifacts: updatedArtifacts,
      };
    }),
  };
});

export function useSessions() {
  return storage(useShallow((state) => state.isDataReady ? state.sessionListViewData : null));
}

export function useSession(id: string): Session | null {
  return storage(useShallow((state) => state.sessions[id] ?? null));
}

const emptyArray: unknown[] = [];

export function useSessionMessages(sessionId: string): { messages: Message[], isLoaded: boolean } {
  return storage(useShallow((state) => {
    const session = state.sessionMessages[sessionId];
    return {
      messages: session?.messages ?? emptyArray,
      isLoaded: session?.isLoaded ?? false,
    };
  }));
}

export function useMessage(sessionId: string, messageId: string): Message | null {
  return storage(useShallow((state) => {
    const session = state.sessionMessages[sessionId];
    return session?.messagesMap[messageId] ?? null;
  }));
}

export function useSessionUsage(sessionId: string) {
  return storage(useShallow((state) => {
    const session = state.sessionMessages[sessionId];
    return session?.reducerState?.latestUsage ?? null;
  }));
}

export function useSettings(): Settings {
  return storage(useShallow((state) => state.settings));
}

export function useSettingMutable<K extends keyof Settings>(name: K): [Settings[K], (value: Settings[K]) => void] {
  const setValue = React.useCallback((value: Settings[K]) => {
    sync.applySettings({ [name]: value });
  }, [name]);
  const value = useSetting(name);
  return [value, setValue];
}

export function useSetting<K extends keyof Settings>(name: K): Settings[K] {
  return storage(useShallow((state) => state.settings[name]));
}

export function useLocalSettings(): LocalSettings {
  return storage(useShallow((state) => state.localSettings));
}

export function useAllMachines(): Machine[] {
  return storage(useShallow((state) => {
    if (!state.isDataReady) return [];
    return (Object.values(state.machines).sort((a, b) => b.createdAt - a.createdAt)).filter((v) => v.active);
  }));
}

export function useMachine(machineId: string): Machine | null {
  return storage(useShallow((state) => state.machines[machineId] ?? null));
}

export function useSessionListViewData(): SessionListViewItem[] | null {
  return storage((state) => state.isDataReady ? state.sessionListViewData : null);
}

export function useAllSessions(): Session[] {
  return storage(useShallow((state) => {
    if (!state.isDataReady) return [];
    return Object.values(state.sessions).sort((a, b) => b.updatedAt - a.updatedAt);
  }));
}

export function useLocalSettingMutable<K extends keyof LocalSettings>(name: K): [LocalSettings[K], (value: LocalSettings[K]) => void] {
  const setValue = React.useCallback((value: LocalSettings[K]) => {
    storage.getState().applyLocalSettings({ [name]: value });
  }, [name]);
  const value = useLocalSetting(name);
  return [value, setValue];
}

// Project management hooks
export function useProjects() {
  return storage(useShallow((state) => state.getProjects()));
}

export function useProject(projectId: string | null) {
  return storage(useShallow((state) => projectId ? state.getProject(projectId) : null));
}

export function useProjectForSession(sessionId: string | null) {
  return storage(useShallow((state) => sessionId ? state.getProjectForSession(sessionId) : null));
}

export function useProjectSessions(projectId: string | null) {
  return storage(useShallow((state) => projectId ? state.getProjectSessions(projectId) : []));
}

export function useProjectGitStatus(projectId: string | null) {
  return storage(useShallow((state) => projectId ? state.getProjectGitStatus(projectId) : null));
}

export function useSessionProjectGitStatus(sessionId: string | null) {
  return storage(useShallow((state) => sessionId ? state.getSessionProjectGitStatus(sessionId) : null));
}

export function useLocalSetting<K extends keyof LocalSettings>(name: K): LocalSettings[K] {
  return storage(useShallow((state) => state.localSettings[name]));
}

export function useEntitlement(id: KnownEntitlements): boolean {
  return storage(useShallow((state) => state.purchases.entitlements[id] ?? false));
}

export function useRealtimeStatus(): 'disconnected' | 'connecting' | 'connected' | 'error' {
  return storage(useShallow((state) => state.realtimeStatus));
}

export function useSocketStatus() {
  return storage(useShallow((state) => ({
    status: state.socketStatus,
    lastConnectedAt: state.socketLastConnectedAt,
    lastDisconnectedAt: state.socketLastDisconnectedAt,
  })));
}

export function useSessionGitStatus(sessionId: string): GitStatus | null {
  return storage(useShallow((state) => state.sessionGitStatus[sessionId] ?? null));
}

export function useIsDataReady(): boolean {
  return storage(useShallow((state) => state.isDataReady));
}

export function useProfile() {
  return storage(useShallow((state) => state.profile));
}

// Artifacts hooks
export function useArtifacts(): DecryptedArtifact[] {
  return storage(useShallow((state) => {
    // Filter out draft artifacts and sort by updatedAt
    return Object.values(state.artifacts)
      .filter(artifact => !artifact.draft)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }));
}

export function useArtifact(id: string): DecryptedArtifact | null {
  return storage(useShallow((state) => state.artifacts[id] ?? null));
}