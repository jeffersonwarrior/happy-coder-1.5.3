import type { MarkdownBlock } from './parseMarkdown';
import { parseMarkdownSpans } from './parseMarkdownSpans';

export function parseMarkdownBlock(markdown: string) {
  // Filter out system tags and other non-user content before parsing
  const filteredMarkdown = filterSystemContent(markdown);

  const blocks: MarkdownBlock[] = [];
  const lines = filteredMarkdown.split('\n');
  let index = 0;
  outer: while (index < lines.length) {
    const line = lines[index];
    index++;

    // Headers
    for (let i = 1; i <= 6; i++) {
      if (line.startsWith(`${'#'.repeat(i)} `)) {
        blocks.push({ type: 'header', level: i as 1 | 2 | 3 | 4 | 5 | 6, content: parseMarkdownSpans(line.slice(i + 1).trim(), true) });
        continue outer;
      }
    }

    // Trim
    const trimmed = line.trim();

    // Code block
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || null;
      const content = [];
      while (index < lines.length) {
        const nextLine = lines[index];
        if (nextLine.trim() === '```') {
          index++;
          break;
        }
        content.push(nextLine);
        index++;
      }
      blocks.push({ type: 'code-block', language, content: content.join('\n') });
      continue;
    }

    // Horizontal rule
    if (trimmed === '---') {
      blocks.push({ type: 'horizontal-rule' });
      continue;
    }

    // Options block
    if (trimmed.startsWith('<options>')) {
      const items: string[] = [];
      // Skip the opening <options> line
      while (index < lines.length) {
        const nextLine = lines[index];
        const nextLineTrimmed = nextLine.trim();

        if (nextLineTrimmed === '</options>') {
          index++;
          break;
        }

        // Extract content from <option> tags
        const optionMatch = nextLineTrimmed.match(/<option>(.*?)<\/option>/);
        if (optionMatch) {
          items.push(optionMatch[1]);
        }
        index++;
      }

      // Always add the options block, even if no items found, to consume the XML tags
      blocks.push({ type: 'options', items });
      continue;
    }

    // If it is a numbered list
    const numberedListMatch = trimmed.match(/^(\d+)\.\s/);
    if (numberedListMatch) {
      const allLines = [{ number: parseInt(numberedListMatch[1]), content: trimmed.slice(numberedListMatch[0].length) }];
      while (index < lines.length) {
        const nextLine = lines[index].trim();
        const nextMatch = nextLine.match(/^(\d+)\.\s/);
        if (!nextMatch) break;
        allLines.push({ number: parseInt(nextMatch[1]), content: nextLine.slice(nextMatch[0].length) });
        index++;
      }
      blocks.push({ type: 'numbered-list', items: allLines.map((l) => ({ number: l.number, spans: parseMarkdownSpans(l.content, false) })) });
      continue;
    }

    // If it is a list
    if (trimmed.startsWith('- ')) {
      const allLines = [trimmed.slice(2)];
      while (index < lines.length && lines[index].trim().startsWith('- ')) {
        allLines.push(lines[index].trim().slice(2));
        index++;
      }
      blocks.push({ type: 'list', items: allLines.map((l) => parseMarkdownSpans(l, false)) });
      continue;
    }

    // Fallback
    if (trimmed.length > 0) {
      blocks.push({ type: 'text', content: parseMarkdownSpans(trimmed, false) });
    }
  }
  return blocks;
}

/**
 * Filter out system tags and other non-user content from markdown
 * Removes XML tags that are not meant for user consumption
 */
function filterSystemContent(markdown: string): string {
  const lines = markdown.split('\n');
  const filteredLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // List of system/internal XML tags to filter out
    const systemTags = [
      'system-reminder',
      'function_calls',
      'antml:function_calls',
      'antml:invoke',
      'antml:parameter',
      'function_results',
      'tool_use',
      'tool_result',
      'commentary',
      'example',
      'reasoning'
    ];

    // Check if this line starts any system tag block
    let isSystemTag = false;
    let tagToClose = '';

    for (const tag of systemTags) {
      if (trimmed.startsWith(`<${tag}>`)) {
        isSystemTag = true;
        tagToClose = `</${tag}>`;
        break;
      }
    }

    if (isSystemTag) {
      // Skip lines until we find the closing tag
      i++;
      while (i < lines.length) {
        const nextLine = lines[i];
        if (nextLine.trim() === tagToClose) {
          i++; // Skip the closing tag too
          break;
        }
        i++;
      }
      continue;
    }

    // Keep the line if it's not a system tag
    filteredLines.push(line);
    i++;
  }

  return filteredLines.join('\n');
}