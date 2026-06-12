/** Configuration entry for a single shorthand doc source. */
export type DocSourceConfig = {
  /** Human-readable label used in logs and error messages. */
  label: string;
  /** URL builder. Receives the slug (e.g. "reference/react/useActionState") and returns the full HTTPS URL. */
  buildUrl: (slug: string) => string;
};

/** Result from the Python extractor subprocess. */
export type ExtractorResult = {
  ok: boolean;
  url?: string;
  text?: string;
  error?: string;
};

/** Runtime configuration knobs. */
export type RuntimeConfig = {
  readonly maxOutputChars: number;
  readonly fetchTimeoutSec: number;
  readonly subprocessTimeoutMs: number;
  readonly subprocessMaxBuffer: number;
};

/** Parameters passed to the fetch_docs tool. */
export type FetchDocsArgs = {
  source: string;
  slug?: string;
};
