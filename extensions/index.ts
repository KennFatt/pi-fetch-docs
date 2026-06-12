import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Type } from '@earendil-works/pi-ai';
import { defineTool, type AgentToolResult, type ExtensionAPI, Theme } from '@earendil-works/pi-coding-agent';
import { Text } from '@earendil-works/pi-tui';

import { BLOCKED_URL_PATTERNS, CONFIG, DOC_SOURCE_MAP } from './config.js';
import type { ExtractorResult, FetchDocsArgs } from './types.js';

function getBlockedReason(url: string): string | null {
  for (const pattern of BLOCKED_URL_PATTERNS) {
    if (pattern.test(url)) {
      return `URL matches blocked pattern: ${pattern}`;
    }
  }
  return null;
}

function resolveUrl(source: string, slug: string): string {
  const cfg = DOC_SOURCE_MAP[source];
  if (cfg) return cfg.buildUrl(slug);

  if (source.startsWith('http://') || source.startsWith('https://')) {
    const blocked = getBlockedReason(source);
    if (blocked) {
      throw new Error(`URL blocked: ${source}. Reason: ${blocked}`);
    }
    return source;
  }

  const shorthandKeys = Object.keys(DOC_SOURCE_MAP).join(', ');
  throw new Error(
    `Unknown doc source: "${source}". ` + `Known shorthands: ${shorthandKeys}. ` + `Or pass a full HTTPS URL.`,
  );
}

const extractorPath = join(dirname(fileURLToPath(import.meta.url)), 'extractor.py');

function runExtractor(url: string, signal: AbortSignal | undefined): ExtractorResult {
  if (signal?.aborted) {
    return { ok: false, error: 'Fetch cancelled.' };
  }

  const output = execSync(`python3 "${extractorPath}" "${url}" ${CONFIG.fetchTimeoutSec} ${CONFIG.maxOutputChars}`, {
    timeout: CONFIG.subprocessTimeoutMs,
    maxBuffer: CONFIG.subprocessMaxBuffer,
    encoding: 'utf-8',
  });

  return JSON.parse(output) as ExtractorResult;
}

function renderCall(args: FetchDocsArgs, theme: Theme) {
  const url = args.slug ? resolveUrl(args.source, args.slug) : resolveUrl(args.source, '');
  let text = theme.fg('toolTitle', theme.bold('fetch_docs '));
  text += theme.fg('accent', url);
  return new Text(text, 0, 0);
}

function renderResult(result: AgentToolResult<{ length?: number }>, { expanded }: { expanded: boolean }, theme: Theme) {
  const content = result.content[0];
  if (content?.type !== 'text') {
    return new Text(theme.fg('error', 'No content'), 0, 0);
  }

  const lines = content.text.split('\n');

  if (content.text.startsWith('Failed')) {
    return new Text(theme.fg('error', lines[0]), 0, 0);
  }

  let text = theme.fg('success', `${lines.length} lines`);

  if (result.details?.length) {
    const kb = (result.details.length / 1024).toFixed(1);
    text += theme.fg('dim', ` (${kb} KB)`);
  }

  if (expanded) {
    const preview = lines.slice(1, 16).join('\n');
    text += `\n${theme.fg('dim', preview)}`;

    if (lines.length > 16) {
      text += `\n${theme.fg('muted', `... ${lines.length - 16} more lines`)}`;
    }
  }

  return new Text(text, 0, 0);
}

const fetchDocsTool = defineTool({
  name: 'fetch_docs',
  label: 'Fetch Docs',
  description:
    'Fetch current documentation from any public HTTPS URL. Returns cleaned, readable text (HTML stripped, markdown-formatted).',
  promptSnippet:
    "Fetch the latest docs when the user mentions a framework, API, version, or tool you don't recognize or that may have changed since your training cutoff.",
  promptGuidelines: [
    'Use fetch_docs whenever the user asks about a framework, library, language feature, or API that was released or significantly updated after January 2025.',
    'Use fetch_docs when you are unsure about an API signature, method name, or feature availability — prefer fetching over guessing.',
    "Use fetch_docs when the user mentions a specific version number (e.g. 'Laravel 13', 'React 19.2', 'Node 26') to ensure you reference the correct API.",
    "Use fetch_docs when the user asks 'how do I do X in Y' where Y is a tool or framework you have incomplete knowledge of.",
    'Use fetch_docs to cross-reference or verify information when the user is comparing two frameworks or migrating between them.',
    'You may fetch multiple docs in sequence when the task requires comparing APIs or gathering information from different sources.',
  ],

  parameters: Type.Object({
    source: Type.String({
      description: 'Doc source key ("react", "mdn", "node", "typescript", "go", "rust") or a full https:// URL',
    }),
    slug: Type.Optional(
      Type.String({
        description: 'Path/slug within the doc source. Not needed if source is a full URL.',
      }),
    ),
  }),

  renderCall,
  renderResult,

  async execute(_toolCallId: string, params: FetchDocsArgs, signal: AbortSignal | undefined) {
    const url = params.slug ? resolveUrl(params.source, params.slug) : resolveUrl(params.source, '');

    const result = runExtractor(url, signal);

    if (result.ok && result.text !== undefined) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `## Docs: ${result.url ?? url}\n\n${result.text}`,
          },
        ],
        details: { url: result.url ?? url, length: result.text.length },
      };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `Failed to fetch docs from ${result.url ?? url}: ${result.error ?? 'Unknown error'}`,
        },
      ],
      details: { error: result.error },
    };
  },
});

/** Registers the fetch_docs tool on the Pi extension API. */
export default function fetchDocs(pi: ExtensionAPI): void {
  pi.registerTool(fetchDocsTool);
}
