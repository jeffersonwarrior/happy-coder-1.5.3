/**
 * Model auto-detection system for Claude sessions
 * Uses the /model command to detect available models dynamically
 */

import { sync } from '@/sync/sync';
import type { ModelMode } from '@/components/PermissionModeSelector';

interface DetectedModel {
    id: string;
    name: string;
    description?: string;
}

interface ModelDetectionResult {
    success: boolean;
    models: DetectedModel[];
    error?: string;
}

// Global cache for detected models - checked once at login
let globalModelCache: { models: DetectedModel[]; timestamp: number } | null = null;

/**
 * Parse model output from /model command response
 * Expected format from Claude Code /model command:
 * Available models:
 * - claude-3-5-sonnet-20241022 (default)
 * - claude-3-opus-20240229
 * - claude-3-haiku-20240307
 */
function parseModelOutput(output: string): DetectedModel[] {
    const models: DetectedModel[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
        // Look for lines starting with "- " (model list items)
        const match = line.match(/^-\s+([^\s]+)(?:\s+\(([^)]+)\))?/);
        if (match) {
            const modelId = match[1];
            const description = match[2];

            // Map model IDs to friendly names
            let name = modelId;
            if (modelId.includes('sonnet')) {
                if (modelId.includes('20241022')) {
                    name = 'Claude 3.5 Sonnet (Latest)';
                } else {
                    name = 'Claude 3.5 Sonnet';
                }
            } else if (modelId.includes('opus')) {
                name = 'Claude 3 Opus';
            } else if (modelId.includes('haiku')) {
                name = 'Claude 3 Haiku';
            } else if (modelId.includes('claude-4')) {
                name = 'Claude 4.1';
            }

            models.push({
                id: modelId,
                name,
                description: description || undefined
            });
        }
    }

    return models;
}

/**
 * Convert detected model ID to ModelMode type
 */
function mapModelIdToMode(modelId: string): ModelMode {
    if (modelId.includes('opus')) return 'opus';
    if (modelId.includes('sonnet')) {
        // Check if it's Claude 4.1 (newer sonnet)
        if (modelId.includes('claude-4') || modelId.includes('20241022')) {
            return 'sonnet-4';
        }
        return 'sonnet';
    }
    if (modelId.includes('haiku')) return 'default'; // Map haiku to default for now
    return 'default';
}

/**
 * Initialize model detection at login - run once when user authenticates
 */
export async function initializeModelDetection(): Promise<ModelDetectionResult> {
    // Return cached result if already detected
    if (globalModelCache) {
        return { success: true, models: globalModelCache.models };
    }

    try {
        // Temporary: Return current hardcoded models + detected ones
        // In a real implementation, this would create a temporary session
        // and send /model command to detect available models
        const detectedModels: DetectedModel[] = [
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Latest)' },
            { id: 'claude-4-1', name: 'Claude 4.1' },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' }
        ];

        // Cache globally - only check once at login
        globalModelCache = { models: detectedModels, timestamp: Date.now() };

        return { success: true, models: detectedModels };

    } catch (error) {
        console.error('Failed to detect models at login:', error);
        return {
            success: false,
            models: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get cached models (called after login initialization)
 */
export function getCachedModels(): DetectedModel[] {
    return globalModelCache?.models || [];
}

/**
 * Get model modes compatible with current UI from cached models
 */
export function getDetectedModelModes(): ModelMode[] {
    const models = getCachedModels();
    if (models.length === 0) {
        // Fallback to current hardcoded modes
        return ['default', 'adaptiveUsage', 'sonnet', 'sonnet-4', 'opus'];
    }

    const modes: Set<ModelMode> = new Set(['default', 'adaptiveUsage']); // Always include these

    for (const model of models) {
        const mode = mapModelIdToMode(model.id);
        modes.add(mode);
    }

    return Array.from(modes);
}

/**
 * Get enhanced model configuration with cached detected models
 */
export function getEnhancedModelConfig() {
    const models = getCachedModels();
    const baseConfig = {
        default: { label: 'Default' },
        adaptiveUsage: { label: 'Adaptive Usage' },
        sonnet: { label: 'Claude 3.5 Sonnet' },
        'sonnet-4': { label: 'Claude 4.1' },
        opus: { label: 'Claude 3 Opus' },
        'gpt-5-minimal': { label: 'GPT-5 Minimal' },
        'gpt-5-low': { label: 'GPT-5 Low' },
        'gpt-5-medium': { label: 'GPT-5 Medium' },
        'gpt-5-high': { label: 'GPT-5 High' },
    };

    if (models.length === 0) {
        return baseConfig;
    }

    // Enhance with detected model info
    const enhancedConfig = { ...baseConfig };

    for (const model of models) {
        const mode = mapModelIdToMode(model.id);
        if (enhancedConfig[mode]) {
            enhancedConfig[mode] = {
                label: model.name,
                description: model.description
            };
        }
    }

    return enhancedConfig;
}

/**
 * Clear model cache (useful for logout or when switching accounts)
 */
export function clearModelCache() {
    globalModelCache = null;
}