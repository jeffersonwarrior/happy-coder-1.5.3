import React, { useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { registerVoiceSession } from './RealtimeSession';
import { storage } from '@/sync/storage';
import { realtimeClientTools } from './realtimeClientTools';
import { getElevenLabsCodeFromPreference } from '@/constants/Languages';
import type { VoiceSession, VoiceSessionConfig } from './types';

// Static reference to the conversation hook instance
let conversationInstance: ReturnType<typeof useConversation> | null = null;

// Global voice session implementation
class RealtimeVoiceSessionImpl implements VoiceSession {
    private _isMuted: boolean = false;

    async startSession(config: VoiceSessionConfig): Promise<void> {
        if (!conversationInstance) {
            console.warn('Realtime voice session not initialized');
            return;
        }

        try {
            storage.getState().setRealtimeStatus('connecting');

            // Request microphone permission first
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (error) {
                console.error('Failed to get microphone permission:', error);
                storage.getState().setRealtimeStatus('error');
                return;
            }


            // Get user's preferred language for voice assistant
            const userLanguagePreference = storage.getState().settings.voiceAssistantLanguage;
            const elevenLabsLanguage = getElevenLabsCodeFromPreference(userLanguagePreference);
            
            // Use custom agent ID if configured, otherwise use hardcoded default
            const customAgentId = storage.getState().settings.elevenLabsAgentId;
            const customApiKey = storage.getState().settings.elevenLabsApiKey;
            const defaultAgentId = __DEV__ ? 'agent_7801k2c0r5hjfraa1kdbytpvs6yt' : 'agent_6701k211syvvegba4kt7m68nxjmw';

            // If custom API key is provided, generate conversation token for private agents
            let sessionConfig: any = {
                agentId: customAgentId || defaultAgentId,
                connectionType: 'webrtc', // Use WebRTC for better performance
                // Pass session ID and initial context as dynamic variables
                dynamicVariables: {
                    sessionId: config.sessionId,
                    initialConversationContext: config.initialContext || ''
                },
                overrides: {
                    agent: {
                        language: elevenLabsLanguage
                    }
                }
            };

            // If custom API key is provided, we need to generate a conversation token
            if (customApiKey && customAgentId) {
                try {
                    const response = await fetch(
                        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${customAgentId}`,
                        {
                            headers: {
                                'xi-api-key': customApiKey,
                            }
                        }
                    );

                    if (response.ok) {
                        const body = await response.json();
                        sessionConfig.conversationToken = body.token;
                        // Remove agentId when using conversation token
                        delete sessionConfig.agentId;
                    } else {
                        console.error('Failed to generate conversation token:', response.status);
                    }
                } catch (error) {
                    console.error('Error generating conversation token:', error);
                }
            }

            const conversationId = await conversationInstance.startSession(sessionConfig);

            console.log('Started conversation with ID:', conversationId);
        } catch (error) {
            console.error('Failed to start realtime session:', error);
            storage.getState().setRealtimeStatus('error');
        }
    }

    async endSession(): Promise<void> {
        if (!conversationInstance) {
            return;
        }

        try {
            await conversationInstance.endSession();
            storage.getState().setRealtimeStatus('disconnected');
        } catch (error) {
            console.error('Failed to end realtime session:', error);
        }
    }

    sendTextMessage(message: string): void {
        if (!conversationInstance) {
            console.warn('Realtime voice session not initialized');
            return;
        }

        conversationInstance.sendUserMessage(message);
    }

    sendContextualUpdate(update: string): void {
        if (!conversationInstance) {
            console.warn('Realtime voice session not initialized');
            return;
        }

        conversationInstance.sendContextualUpdate(update);
    }

    mute(): void {
        try {
            this._isMuted = true;
            // For now, we just track mute state internally
            // Future: integrate with ElevenLabs mute API when available
            console.log('Voice session muted');
        } catch (error) {
            console.error('Failed to mute voice session:', error);
        }
    }

    unmute(): void {
        try {
            this._isMuted = false;
            // For now, we just track mute state internally
            // Future: integrate with ElevenLabs mute API when available
            console.log('Voice session unmuted');
        } catch (error) {
            console.error('Failed to unmute voice session:', error);
        }
    }

    isMuted(): boolean {
        return this._isMuted;
    }
}

export const RealtimeVoiceSession: React.FC = () => {
    const conversation = useConversation({
        clientTools: realtimeClientTools,
        onConnect: () => {
            // console.log('Realtime session connected');
            storage.getState().setRealtimeStatus('connected');
        },
        onDisconnect: () => {
            // console.log('Realtime session disconnected');
            storage.getState().setRealtimeStatus('disconnected');
        },
        onMessage: (data) => {
            // console.log('Realtime message:', data);
        },
        onError: (error) => {
            // console.error('Realtime error:', error);
            storage.getState().setRealtimeStatus('error');
        },
        onStatusChange: (data) => {
            // console.log('Realtime status change:', data);
        },
        onModeChange: (data) => {
            // console.log('Realtime mode change:', data);
        },
        onDebug: (message) => {
            // console.debug('Realtime debug:', message);
        }
    });

    const hasRegistered = useRef(false);

    useEffect(() => {
        // Store the conversation instance globally
        conversationInstance = conversation;

        // Register the voice session once
        if (!hasRegistered.current) {
            try {
                registerVoiceSession(new RealtimeVoiceSessionImpl());
                hasRegistered.current = true;
            } catch (error) {
                console.error('Failed to register voice session:', error);
            }
        }

        return () => {
            // Clean up on unmount
            conversationInstance = null;
        };
    }, [conversation]);

    // This component doesn't render anything visible
    return null;
};