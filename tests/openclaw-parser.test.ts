import { describe, it, expect } from 'vitest';
import { openClawAdapter } from '../src/ingest/openclaw.js';
import type { OpenClawEntry } from '../src/ingest/openclaw.js';

describe('openclaw-parser', () => {
  describe('mapEntryToEvents', () => {
    it('maps session header to session_start', () => {
      const entry: OpenClawEntry = {
        type: 'session',
        version: 3,
        id: 'test-session-id',
        timestamp: '2025-01-01T10:00:00Z',
        cwd: '/home/user/project',
      };

      const events = openClawAdapter.mapEntryToEvents(entry);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('session_start');
      expect(events[0].data.cwd).toBe('/home/user/project');
      expect(events[0].timestamp).toBe('2025-01-01T10:00:00Z');
    });

    it('maps user message to user_prompt', () => {
      const entry: OpenClawEntry = {
        type: 'message',
        id: 'msg-001',
        parentId: null,
        timestamp: '2025-01-01T10:01:00Z',
        message: {
          role: 'user',
          content: 'Help me fix this bug',
          timestamp: 1735729260000,
        },
      };

      const events = openClawAdapter.mapEntryToEvents(entry);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('user_prompt');
      expect(events[0].data.content).toBe('Help me fix this bug');
    });

    it('maps user message with array content', () => {
      const entry: OpenClawEntry = {
        type: 'message',
        id: 'msg-002',
        parentId: null,
        timestamp: '2025-01-01T10:01:00Z',
        message: {
          role: 'user',
          content: [
            { type: 'text', text: 'First part' },
            { type: 'text', text: 'Second part' },
          ],
          timestamp: 1735729260000,
        },
      };

      const events = openClawAdapter.mapEntryToEvents(entry);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('user_prompt');
      expect(events[0].data.content).toBe('First part\nSecond part');
    });

    it('maps assistant text to ai_response', () => {
      const entry: OpenClawEntry = {
        type: 'message',
        id: 'msg-003',
        parentId: 'msg-001',
        timestamp: '2025-01-01T10:02:00Z',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'I can help with that!' }],
          model: 'claude-3-5-sonnet-20241022',
          provider: 'anthropic',
          api: 'anthropic-messages',
          stopReason: 'stop',
          timestamp: 1735729320000,
        },
      };

      const events = openClawAdapter.mapEntryToEvents(entry);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('ai_response');
      expect(events[0].data.content).toBe('I can help with that!');
      expect(events[0].data.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('maps assistant thinking to ai_response with is_thinking flag', () => {
      const entry: OpenClawEntry = {
        type: 'message',
        id: 'msg-004',
        parentId: 'msg-001',
        timestamp: '2025-01-01T10:02:00Z',
        message: {
          role: 'assistant',
          content: [
            { type: 'thinking', thinking: 'Let me analyze the code...' },
            { type: 'text', text: 'Here is my analysis.' },
          ],
          model: 'claude-3-5-sonnet-20241022',
          timestamp: 1735729320000,
        },
      };

      const events = openClawAdapter.mapEntryToEvents(entry);
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('ai_response');
      expect(events[0].data.is_thinking).toBe(true);
      expect(events[0].data.content).toBe('Let me analyze the code...');
      expect(events[1].type).toBe('ai_response');
      expect(events[1].data.content).toBe('Here is my analysis.');
    });

    it('maps assistant toolCall to tool_use', () => {
      const entry: OpenClawEntry = {
        type: 'message',
        id: 'msg-005',
        parentId: 'msg-001',
        timestamp: '2025-01-01T10:03:00Z',
        message: {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me read the file.' },
            {
              type: 'toolCall',
              id: 'tool-001',
              name: 'read',
              arguments: { path: './src/main.ts' },
            },
          ],
          model: 'claude-3-5-sonnet-20241022',
          stopReason: 'toolUse',
          timestamp: 1735729380000,
        },
      };

      const events = openClawAdapter.mapEntryToEvents(entry);
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('ai_response');
      expect(events[1].type).toBe('tool_use');
      expect(events[1].data.tool_name).toBe('read');
      expect(events[1].data.tool_id).toBe('tool-001');
      expect((events[1].data.tool_input as Record<string, unknown>).path).toBe('./src/main.ts');
    });

    it('maps toolResult to tool_result', () => {
      const entry: OpenClawEntry = {
        type: 'message',
        id: 'msg-006',
        parentId: 'msg-005',
        timestamp: '2025-01-01T10:03:01Z',
        message: {
          role: 'toolResult',
          toolCallId: 'tool-001',
          toolName: 'read',
          content: [{ type: 'text', text: 'import React from "react";' }],
          isError: false,
          timestamp: 1735729381000,
        },
      };

      const events = openClawAdapter.mapEntryToEvents(entry);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('tool_result');
      expect(events[0].data.tool_use_id).toBe('tool-001');
      expect(events[0].data.tool_name).toBe('read');
      expect(events[0].data.content).toBe('import React from "react";');
      expect(events[0].data.is_error).toBe(false);
    });

    it('maps error toolResult with is_error flag', () => {
      const entry: OpenClawEntry = {
        type: 'message',
        id: 'msg-007',
        parentId: 'msg-005',
        timestamp: '2025-01-01T10:03:02Z',
        message: {
          role: 'toolResult',
          toolCallId: 'tool-002',
          toolName: 'Bash',
          content: [{ type: 'text', text: 'command not found: foobar' }],
          isError: true,
          timestamp: 1735729382000,
        },
      };

      const events = openClawAdapter.mapEntryToEvents(entry);
      expect(events).toHaveLength(1);
      expect(events[0].data.is_error).toBe(true);
    });

    it('maps session_info to session_info event', () => {
      const entry: OpenClawEntry = {
        type: 'session_info',
        id: 'info-001',
        parentId: null,
        timestamp: '2025-01-01T10:04:00Z',
        name: 'React Project Setup',
      };

      const events = openClawAdapter.mapEntryToEvents(entry);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('session_info');
      expect(events[0].data.name).toBe('React Project Setup');
    });

    it('skips compaction entries', () => {
      const entry: OpenClawEntry = {
        type: 'compaction',
        id: 'comp-001',
        parentId: 'msg-010',
        timestamp: '2025-01-01T10:10:00Z',
        summary: 'Previous context summarized...',
        firstKeptEntryId: 'msg-008',
        tokensBefore: 3500,
      };

      const events = openClawAdapter.mapEntryToEvents(entry);
      expect(events).toHaveLength(0);
    });

    it('skips model_change entries', () => {
      const entry: OpenClawEntry = {
        type: 'model_change',
        id: 'mc-001',
        parentId: 'msg-003',
        timestamp: '2025-01-01T10:05:00Z',
        provider: 'openai',
        modelId: 'gpt-4o',
      };

      const events = openClawAdapter.mapEntryToEvents(entry);
      expect(events).toHaveLength(0);
    });

    it('falls back to message timestamp when outer timestamp missing', () => {
      const entry: OpenClawEntry = {
        type: 'message',
        id: 'msg-008',
        parentId: null,
        message: {
          role: 'user',
          content: 'test',
          timestamp: 1735729260000,
        },
      };

      const events = openClawAdapter.mapEntryToEvents(entry);
      expect(events).toHaveLength(1);
      expect(events[0].timestamp).toBe(new Date(1735729260000).toISOString());
    });
  });
});
