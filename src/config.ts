export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export interface Config {
  apiKey: string;
  apiBase: string;
}

// The live API is served from the api. subdomain; rcvd.cc is the landing page.
const DEFAULT_API_BASE = "https://api.rcvd.cc";

export function loadConfig(env: Record<string, string | undefined>): Config {
  const apiKey = env.RCVD_API_KEY;
  if (!apiKey || apiKey.length === 0) {
    throw new ConfigError(
      "RCVD_API_KEY is required but was not set. Message @RcvdBot on Telegram with /start to get a key, then set it in your MCP host config (e.g. claude_desktop_config.json under mcpServers.rcvd.env.RCVD_API_KEY).",
    );
  }

  const rawBase = env.RCVD_API_BASE ?? DEFAULT_API_BASE;
  let apiBase: string;
  try {
    const url = new URL(rawBase);
    apiBase = `${url.protocol}//${url.host}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    throw new ConfigError(
      `RCVD_API_BASE is not a valid URL: ${JSON.stringify(rawBase)}. Expected something like 'https://api.rcvd.cc' or 'http://localhost:8080'.`,
    );
  }

  return { apiKey, apiBase };
}
