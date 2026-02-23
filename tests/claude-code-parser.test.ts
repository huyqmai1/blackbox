import { describe, it, expect } from 'vitest';
import { mapEntryToEvents, type ClaudeCodeEntry } from '../src/ingest/claude-code.js';

describe('claude-code-parser', () => {
  describe('mapEntryToEvents', () => {
    it('maps user message to user_prompt', () => {
      const entry: ClaudeCodeEntry = {
        type: 'user',
        message: {
          role: 'user',
          content: 'Hello, help me fix this bug',
        },
        timestamp: '2024-01-01T00:00:00Z',
      };

      const events = mapEntryToEvents(entry);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('user_prompt');
      expect(events[0].data.content).toBe('Hello, help me fix this bug');
      expect(events[0].timestamp).toBe('2024-01-01T00:00:00Z');
    });

    it('maps assistant text response to ai_response', () => {
      const entry: ClaudeCodeEntry = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'I can help with that!' }],
          model: 'claude-sonnet-4-20250514',
        },
        timestamp: '2024-01-01T00:01:00Z',
      };

      const events = mapEntryToEvents(entry);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('ai_response');
      expect(events[0].data.content).toBe('I can help with that!');
      expect(events[0].data.model).toBe('claude-sonnet-4-20250514');
    });

    it('maps assistant tool_use blocks to tool_use events', () => {
      const entry: ClaudeCodeEntry = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me read the file.' },
            {
              type: 'tool_use',
              id: 'tool_123',
              name: 'Read',
              input: { file_path: '/src/index.ts' },
            },
          ],
        },
        timestamp: '2024-01-01T00:02:00Z',
      };

      const events = mapEntryToEvents(entry);
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('ai_response');
      expect(events[0].data.content).toBe('Let me read the file.');
      expect(events[1].type).toBe('tool_use');
      expect(events[1].data.tool_name).toBe('Read');
      expect(events[1].data.tool_id).toBe('tool_123');
    });

    it('maps user message with array content', () => {
      const entry: ClaudeCodeEntry = {
        type: 'user',
        message: {
          role: 'user',
          content: [
            { type: 'text', text: 'Please fix this' },
            { type: 'text', text: 'Also add tests' },
          ],
        },
        timestamp: '2024-01-01T00:03:00Z',
      };

      const events = mapEntryToEvents(entry);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('user_prompt');
      expect(events[0].data.content).toBe('Please fix this\nAlso add tests');
    });

    it('handles entries with no meaningful content gracefully', () => {
      const entry: ClaudeCodeEntry = {
        type: 'user',
        message: {
          role: 'user',
          content: [],
        },
        timestamp: '2024-01-01T00:04:00Z',
      };

      const events = mapEntryToEvents(entry);
      expect(events).toHaveLength(0);
    });

    it('maps unknown types as generic events', () => {
      const entry: ClaudeCodeEntry = {
        type: 'system-notification',
        timestamp: '2024-01-01T00:05:00Z',
        data: { info: 'something' },
      };

      const events = mapEntryToEvents(entry);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('system-notification');
    });
  });
});
