import type { DocSourceConfig, RuntimeConfig } from './types.js';

/** Mapping of shorthand keys to documentation source configurations. */
export const DOC_SOURCE_MAP: Record<string, DocSourceConfig> = {
  react: {
    label: 'React',
    buildUrl: (slug) => `https://react.dev/${slug}`,
  },
  mdn: {
    label: 'MDN Web Docs',
    buildUrl: (slug) => `https://developer.mozilla.org/en-US/docs/Web/${slug}`,
  },
  typescript: {
    label: 'TypeScript',
    buildUrl: (slug) => `https://www.typescriptlang.org/docs/handbook/${slug}.html`,
  },
  nextjs: {
    label: 'Next.js',
    buildUrl: (slug) => `https://nextjs.org/docs/${slug}`,
  },
  vue: {
    label: 'Vue.js',
    buildUrl: (slug) => `https://vuejs.org/${slug}`,
  },
  svelte: {
    label: 'Svelte',
    buildUrl: (slug) => `https://svelte.dev/docs/${slug}`,
  },
  tailwind: {
    label: 'Tailwind CSS',
    buildUrl: (slug) => `https://tailwindcss.com/docs/${slug}`,
  },
  vite: {
    label: 'Vite',
    buildUrl: (slug) => `https://vitejs.dev/${slug}`,
  },
  vitest: {
    label: 'Vitest',
    buildUrl: (slug) => `https://vitest.dev/${slug}`,
  },
  playwright: {
    label: 'Playwright',
    buildUrl: (slug) => `https://playwright.dev/docs/${slug}`,
  },

  node: {
    label: 'Node.js',
    buildUrl: (slug) => `https://nodejs.org/api/${slug}.html`,
  },
  go: {
    label: 'Go',
    buildUrl: (slug) => `https://pkg.go.dev/${slug}`,
  },
  rust: {
    label: 'Rust',
    buildUrl: (slug) => `https://doc.rust-lang.org/std/${slug}`,
  },
  python: {
    label: 'Python',
    buildUrl: (slug) => `https://docs.python.org/3/${slug}`,
  },
  rails: {
    label: 'Ruby on Rails',
    buildUrl: (slug) => `https://guides.rubyonrails.org/${slug}`,
  },

  postgres: {
    label: 'PostgreSQL',
    buildUrl: (slug) => `https://www.postgresql.org/docs/current/${slug}`,
  },
  mysql: {
    label: 'MySQL',
    buildUrl: (slug) => `https://dev.mysql.com/doc/refman/8.4/en/${slug}`,
  },
  redis: {
    label: 'Redis',
    buildUrl: (slug) => `https://redis.io/docs/${slug}`,
  },
  mongodb: {
    label: 'MongoDB',
    buildUrl: (slug) => `https://www.mongodb.com/docs/${slug}`,
  },
  prisma: {
    label: 'Prisma',
    buildUrl: (slug) => `https://www.prisma.io/docs/${slug}`,
  },

  k8s: {
    label: 'Kubernetes',
    buildUrl: (slug) => `https://kubernetes.io/docs/${slug}`,
  },
  docker: {
    label: 'Docker',
    buildUrl: (slug) => `https://docs.docker.com/${slug}`,
  },
};

/** URL patterns that are unconditionally blocked for security. */
export const BLOCKED_URL_PATTERNS: readonly RegExp[] = [
  /^http:\/\//, // plain HTTP
  /^(?!https?:\/\/)/, // non-http protocols (file://, etc.)
  /https?:\/\/(localhost|127\.\d+\.\d+\.\d+|\[::1\])([:/]|$)/, // localhost / loopback
  /https?:\/\/(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)([:/]|$)/, // private IPv4 (RFC 1918)
  /https?:\/\/169\.254\.169\.254([:/]|$)/, // cloud metadata endpoints
];

/** Runtime configuration controlling output size, timeouts, and buffer limits. */
export const CONFIG: RuntimeConfig = {
  /** Max output size (characters) before truncation. */
  maxOutputChars: 30_000,
  /** HTTP fetch timeout in seconds (passed to Python urllib). */
  fetchTimeoutSec: 20,
  /** Hard kill timeout for the Python subprocess (ms). */
  subprocessTimeoutMs: 30_000,
  /** Max buffer size for stdout from Python subprocess (bytes). */
  subprocessMaxBuffer: 1_024 * 1_024, // 1 MB
} as const;
