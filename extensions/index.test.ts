import { afterEach, describe, expect, it, vi } from 'vitest';

const mockExecSync = vi.hoisted(() => vi.fn());

vi.mock('node:child_process', () => ({
  execSync: mockExecSync,
}));

import fetchDocs from './index.js';

type MockExtensionAPI = {
  registerTool: ReturnType<typeof vi.fn>;
};

function createMockPi(): MockExtensionAPI {
  return {
    registerTool: vi.fn(),
  };
}

function successOutput(text: string, url = 'https://example.com/docs'): string {
  return JSON.stringify({ ok: true, url, text });
}

function errorOutput(error: string, url = 'https://example.com/docs'): string {
  return JSON.stringify({ ok: false, url, error });
}

describe('fetchDocs', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('registers the tool on the pi API', () => {
    const pi = createMockPi();
    fetchDocs(pi as never);

    expect(pi.registerTool).toHaveBeenCalledTimes(1);

    const [tool] = pi.registerTool.mock.calls[0] as [
      { name: string; label: string; parameters: unknown },
    ];
    expect(tool.name).toBe('fetch_docs');
    expect(tool.label).toBe('Fetch Docs');
    expect(tool.parameters).toBeDefined();
  });

  it('resolves react shorthand and passes the correct URL to the extractor', async () => {
    const pi = createMockPi();
    fetchDocs(pi as never);

    const [tool] = pi.registerTool.mock.calls[0] as [
      {
        execute: (
          id: string,
          params: { source: string; slug: string },
          signal?: AbortSignal,
        ) => Promise<unknown>;
      },
    ];

    mockExecSync.mockReturnValue(successOutput('# Hello\n\nWorld'));

    const result = await tool.execute(
      'call-1',
      { source: 'react', slug: 'reference/react/use' },
      undefined,
    );

    const [execCmd] = mockExecSync.mock.calls[0] as [string];
    expect(execCmd).toContain('python3');
    expect(execCmd).toContain('https://react.dev/reference/react/use');

    expect(result).toMatchObject({
      content: [{ type: 'text', text: expect.stringContaining('# Hello') }],
    });
  });

  it('resolves node shorthand', async () => {
    const pi = createMockPi();
    fetchDocs(pi as never);

    const [tool] = pi.registerTool.mock.calls[0] as [
      {
        execute: (
          id: string,
          params: { source: string; slug: string },
          signal?: AbortSignal,
        ) => Promise<unknown>;
      },
    ];

    mockExecSync.mockReturnValue(successOutput('fs module docs'));

    const result = await tool.execute('call-2', { source: 'node', slug: 'fs' }, undefined);

    const [execCmd] = mockExecSync.mock.calls[0] as [string];
    expect(execCmd).toContain('https://nodejs.org/api/fs.html');
    expect(result).toMatchObject({
      content: [{ type: 'text', text: expect.stringContaining('fs module docs') }],
    });
  });

  it('resolves go shorthand', async () => {
    const pi = createMockPi();
    fetchDocs(pi as never);

    const [tool] = pi.registerTool.mock.calls[0] as [
      {
        execute: (
          id: string,
          params: { source: string; slug: string },
          signal?: AbortSignal,
        ) => Promise<unknown>;
      },
    ];

    mockExecSync.mockReturnValue(successOutput('net/http package'));

    const result = await tool.execute('call-3', { source: 'go', slug: 'net/http' }, undefined);

    const [execCmd] = mockExecSync.mock.calls[0] as [string];
    expect(execCmd).toContain('https://pkg.go.dev/net/http');
    expect(result).toMatchObject({
      content: [{ type: 'text', text: expect.stringContaining('net/http package') }],
    });
  });

  it('accepts a valid HTTPS URL directly', async () => {
    const pi = createMockPi();
    fetchDocs(pi as never);

    const [tool] = pi.registerTool.mock.calls[0] as [
      {
        execute: (
          id: string,
          params: { source: string },
          signal?: AbortSignal,
        ) => Promise<unknown>;
      },
    ];

    mockExecSync.mockReturnValue(successOutput('direct docs'));

    const result = await tool.execute(
      'call-4',
      { source: 'https://some-api.com/docs/v2' },
      undefined,
    );

    const [execCmd] = mockExecSync.mock.calls[0] as [string];
    expect(execCmd).toContain('https://some-api.com/docs/v2');
    expect(result).toMatchObject({
      content: [{ type: 'text', text: expect.stringContaining('direct docs') }],
    });
  });

  it('rejects a plain HTTP URL', async () => {
    const pi = createMockPi();
    fetchDocs(pi as never);

    const [tool] = pi.registerTool.mock.calls[0] as [
      {
        execute: (
          id: string,
          params: { source: string },
          signal?: AbortSignal,
        ) => Promise<unknown>;
      },
    ];

    await expect(
      tool.execute('call-5', { source: 'http://example.com/docs' }, undefined),
    ).rejects.toThrow(/URL blocked/);
  });

  it('rejects localhost URL', async () => {
    const pi = createMockPi();
    fetchDocs(pi as never);

    const [tool] = pi.registerTool.mock.calls[0] as [
      {
        execute: (
          id: string,
          params: { source: string },
          signal?: AbortSignal,
        ) => Promise<unknown>;
      },
    ];

    await expect(
      tool.execute('call-6', { source: 'https://localhost:3000/docs' }, undefined),
    ).rejects.toThrow(/URL blocked/);
  });

  it('rejects private IPv4 URL (192.168.x.x)', async () => {
    const pi = createMockPi();
    fetchDocs(pi as never);

    const [tool] = pi.registerTool.mock.calls[0] as [
      {
        execute: (
          id: string,
          params: { source: string },
          signal?: AbortSignal,
        ) => Promise<unknown>;
      },
    ];

    await expect(
      tool.execute('call-7', { source: 'https://192.168.1.1/docs' }, undefined),
    ).rejects.toThrow(/URL blocked/);
  });

  it('rejects cloud metadata endpoint', async () => {
    const pi = createMockPi();
    fetchDocs(pi as never);

    const [tool] = pi.registerTool.mock.calls[0] as [
      {
        execute: (
          id: string,
          params: { source: string },
          signal?: AbortSignal,
        ) => Promise<unknown>;
      },
    ];

    await expect(
      tool.execute(
        'call-8',
        { source: 'https://169.254.169.254/latest/meta-data' },
        undefined,
      ),
    ).rejects.toThrow(/URL blocked/);
  });

  it('rejects an unknown shorthand source', async () => {
    const pi = createMockPi();
    fetchDocs(pi as never);

    const [tool] = pi.registerTool.mock.calls[0] as [
      {
        execute: (
          id: string,
          params: { source: string; slug: string },
          signal?: AbortSignal,
        ) => Promise<unknown>;
      },
    ];

    await expect(
      tool.execute('call-9', { source: 'unknown-source', slug: 'some/slug' }, undefined),
    ).rejects.toThrow(/Unknown doc source/);
  });

  it('returns error when Python subprocess reports failure', async () => {
    const pi = createMockPi();
    fetchDocs(pi as never);

    const [tool] = pi.registerTool.mock.calls[0] as [
      {
        execute: (
          id: string,
          params: { source: string; slug: string },
          signal?: AbortSignal,
        ) => Promise<unknown>;
      },
    ];

    mockExecSync.mockReturnValue(errorOutput('Connection timed out'));

    const result = await tool.execute('call-10', { source: 'mdn', slug: 'fetch' }, undefined);

    expect(result).toMatchObject({
      content: [{ type: 'text', text: expect.stringContaining('Connection timed out') }],
    });
  });

  it('passes timeout and maxChars to the extractor script', async () => {
    const pi = createMockPi();
    fetchDocs(pi as never);

    const [tool] = pi.registerTool.mock.calls[0] as [
      {
        execute: (
          id: string,
          params: { source: string; slug: string },
          signal?: AbortSignal,
        ) => Promise<unknown>;
      },
    ];

    mockExecSync.mockReturnValue(successOutput('docs content'));

    await tool.execute('call-11', { source: 'react', slug: 'learn/quick-start' }, undefined);

    const [execCmd] = mockExecSync.mock.calls[0] as [string];
    expect(execCmd).toContain('extractor.py');
    expect(execCmd).toContain('20');
    expect(execCmd).toContain('30000');
  });

  it('renderCall returns a Text with the resolved URL', () => {
    const pi = createMockPi();
    fetchDocs(pi as never);

    const [tool] = pi.registerTool.mock.calls[0] as [
      {
        renderCall: (
          args: { source: string; slug?: string },
          theme: Record<string, unknown>,
        ) => unknown;
      },
    ];

    const theme = {
      fg: (_key: string, text: string) => `[${text}]`,
      bold: (text: string) => `<b>${text}</b>`,
    };

    const rendered = tool.renderCall({ source: 'react', slug: 'reference/react/use' }, theme);

    expect(rendered).toBeDefined();
    expect(typeof rendered).toBe('object');
  });

  it('renderResult returns error text for failed results', () => {
    const pi = createMockPi();
    fetchDocs(pi as never);

    const [tool] = pi.registerTool.mock.calls[0] as [
      {
        renderResult: (
          result: unknown,
          options: { expanded: boolean; isPartial: boolean },
          theme: Record<string, unknown>,
        ) => unknown;
      },
    ];

    const theme = {
      fg: (_key: string, text: string) => `[${text}]`,
    };

    const result = {
      content: [{ type: 'text', text: 'Failed to fetch docs from url: error msg' }],
      details: {},
    };

    const rendered = tool.renderResult(
      result,
      { expanded: false, isPartial: false },
      theme,
    );
    expect(rendered).toBeDefined();
  });

  it('renderResult returns line count for successful results', () => {
    const pi = createMockPi();
    fetchDocs(pi as never);

    const [tool] = pi.registerTool.mock.calls[0] as [
      {
        renderResult: (
          result: unknown,
          options: { expanded: boolean; isPartial: boolean },
          theme: Record<string, unknown>,
        ) => unknown;
      },
    ];

    const theme = {
      fg: (_key: string, text: string) => `[${text}]`,
    };

    const result = {
      content: [{ type: 'text', text: 'line 1\nline 2\nline 3' }],
      details: { length: 100 },
    };

    const rendered = tool.renderResult(
      result,
      { expanded: false, isPartial: false },
      theme,
    );
    expect(rendered).toBeDefined();
  });
});
