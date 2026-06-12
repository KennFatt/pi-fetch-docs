# pi-fetch-docs

A Pi coding agent extension that fetches and cleans documentation from any public HTTPS URL. Returns cleaned, readable Markdown-formatted text.

## What it does

When the agent needs current documentation for a framework, API, or tool, it calls `fetch_docs` with either a shorthand source key + slug, or a full HTTPS URL.

The tool:

1. Resolves the source to a full URL (shorthand lookup or direct pass-through)
2. Validates the URL against a blocklist (no HTTP, no localhost, no private IPs)
3. Fetches the page via Python's `urllib` + `html.parser`
4. Extracts meaningful text content (strips nav, sidebar, footer, scripts, styles)
5. Returns clean Markdown-formatted output, truncated at 30KB

## Supported shorthands

| Key | Source | Example slug |
|-----|--------|--------------|
| `react` | react.dev | `reference/react/use` |
| `mdn` | MDN Web Docs | `API/Fetch_API` |
| `typescript` | TypeScript Handbook | `advanced-types` |
| `nextjs` | Next.js | `app/building-your-application/routing` |
| `node` | Node.js | `fs` |
| `go` | pkg.go.dev | `net/http` |
| `rust` | doc.rust-lang.org | `collections` |
| `python` | docs.python.org | `library/asyncio` |
| `tailwind` | Tailwind CSS | `flex` |
| `vite` | Vite | `config` |
| `vitest` | Vitest | `api` |
| `postgres` | PostgreSQL | `sql-createtable` |
| `prisma` | Prisma | `orm/prisma-schema` |
| `docker` | Docker | `engine` |
| `k8s` | Kubernetes | `concepts/overview` |

Full list in `extensions/config.ts`.

## Security

These URL patterns are blocked unconditionally:

- Plain `http://`
- Non-http protocols (`file://`, etc.)
- Localhost / loopback (`127.x.x.x`, `::1`)
- Private IPv4 ranges (RFC 1918: `10.x`, `172.16-31.x`, `192.168.x`)
- Cloud metadata endpoints (`169.254.169.254`)

Everything else — any public HTTPS site — is allowed.

## Installation

### From npm

```bash
pi install npm:pi-fetch-docs
```

### From git

```bash
pi install git:github.com/kennfatt/pi-fetch-docs
```

Then reload pi:

```text
/reload
```

### From a local checkout

```bash
pi install /absolute/path/to/pi-fetch-docs
```

## Usage

The agent invokes the tool automatically when it encounters a framework, API, or tool it doesn't recognize. You can also ask for docs explicitly:

```text
> fetch the react docs for useActionState
> what's the latest Node.js fs API?
```

## Customization

- Add shorthands: edit `extensions/config.ts` → `DOC_SOURCE_MAP`
- Block more URLs: edit `extensions/config.ts` → `BLOCKED_URL_PATTERNS`
- Tune timeout/size: edit `extensions/config.ts` → `CONFIG`

## Development

```bash
npm install
npm test
```

## Intent

This extension keeps the agent's knowledge current by fetching real documentation at runtime — no guessing, no stale training data.
