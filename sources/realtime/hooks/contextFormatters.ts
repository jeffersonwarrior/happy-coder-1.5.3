import { Session } from '@/sync/storageTypes';
import { Message } from '@/sync/typesMessage';
import { trimIdent } from '@/utils/trimIdent';
import { VOICE_CONFIG } from '../voiceConfig';

interface SessionMetadata {
  summary?: { text?: string };
  path?: string;
  machineId?: string;
  homeDir?: string;
  [key: string]: any;
}

/**
 * Format a permission request for natural language context
 */
export function formatPermissionRequest(sessionId: string, requestId: string, toolName: string, toolArgs: any): string {
  return trimIdent(`
        Claude Code is requesting permission to use ${toolName} (session ${sessionId}):
        <request_id>${requestId}</request_id>
        <tool_name>${toolName}</tool_name>
        <tool_args>${JSON.stringify(toolArgs)}</tool_args>
    `);
}

//
// Message formatting
//

export function formatMessage(message: Message): string | null {
  // Lines
  const lines: string[] = [];
  if (message.kind === 'agent-text') {
    lines.push(`Claude Code: \n<text>${message.text}</text>`);
  } else if (message.kind === 'user-text') {
    lines.push(`User sent message: \n<text>${message.text}</text>`);
  } else if (message.kind === 'tool-call' && !VOICE_CONFIG.DISABLE_TOOL_CALLS) {
    const toolDescription = message.tool.description ? ` - ${message.tool.description}` : '';
    if (VOICE_CONFIG.LIMITED_TOOL_CALLS) {
      if (message.tool.description) {
        lines.push(`Claude Code is using ${message.tool.name}${toolDescription}`);
      }
    } else {
      lines.push(
        `Claude Code is using ${message.tool.name}${toolDescription} (tool_use_id: ${message.id}) with arguments: <arguments>${JSON.stringify(message.tool.input)}</arguments>`
      );
    }
  }
  if (lines.length === 0) {
    return null;
  }
  return lines.join('\n\n');
}

export function formatNewSingleMessage(sessionId: string, message: Message): string | null {
  const formatted = formatMessage(message);
  if (!formatted) {
    return null;
  }
  return `New message in session: ${sessionId}\n\n${formatted}`;
}

export function formatNewMessages(sessionId: string, messages: Message[]): string | null {
  const formatted = [...messages]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(formatMessage)
    .filter(Boolean);
  if (formatted.length === 0) {
    return null;
  }
  return `New messages in session: ${sessionId}\n\n${formatted.join('\n\n')}`;
}

export function formatHistory(sessionId: string, messages: Message[]): string {
  const messagesToFormat =
    VOICE_CONFIG.MAX_HISTORY_MESSAGES > 0 ? messages.slice(0, VOICE_CONFIG.MAX_HISTORY_MESSAGES) : messages;
  const formatted = messagesToFormat.map(formatMessage).filter(Boolean);
  return `History of messages in session: ${sessionId}\n\n${formatted.join('\n\n')}`;
}

//
// Session states
//

export function formatSessionFull(session: Session, messages: Message[]): string {
  const sessionName = session.metadata?.summary?.text;
  const sessionPath = session.metadata?.path;
  const lines: string[] = [];

  // Add session context
  lines.push(`# Session ID: ${session.id}`);
  lines.push(`# Project path: ${sessionPath}`);
  lines.push(`# Session summary:\n${sessionName}`);

  // Add session metadata if available
  if (session.metadata?.summary?.text) {
    lines.push('## Session Summary');
    lines.push(session.metadata.summary.text);
    lines.push('');
  }

  // Add history
  lines.push('## Our interaction history so far');
  lines.push('');
  lines.push(formatHistory(session.id, messages));

  return lines.join('\n\n');
}

export function formatSessionOffline(sessionId: string, metadata?: SessionMetadata): string {
  return `Session went offline: ${sessionId}`;
}

export function formatSessionOnline(sessionId: string, metadata?: SessionMetadata): string {
  return `Session came online: ${sessionId}`;
}

export function formatSessionFocus(sessionId: string, metadata?: SessionMetadata): string {
  return `Session became focused: ${sessionId}`;
}

export function formatReadyEvent(sessionId: string): string {
  return `Claude Code done working in session: ${sessionId}. The previous message(s) are the summary of the work done. Report this to the human immediately.`;
}
