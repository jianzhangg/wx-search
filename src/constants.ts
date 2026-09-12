export const REQUEST_TIMEOUT_MS = 15_000;

export const SOGOU_BASE_URL = 'https://weixin.sogou.com';

/** Env var override for the User-Agent (lowest priority after --user-agent). */
export const USER_AGENT_ENV_VAR = 'WX_SEARCH_UA';

/**
 * Default User-Agent: plain Chrome on Windows, no `Edg/` token.
 * Sogou sends the Edge-suffixed UA straight to the anti-spider challenge,
 * while the plain-Chrome UA is served normally (verified 2026-09-12).
 */
export const DEFAULT_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36';

/**
 * Resolve the effective User-Agent.
 * Priority: explicit flag > WX_SEARCH_UA env var > built-in default.
 */
export function resolveUserAgent(cliFlag?: string): string {
    const flag = cliFlag?.trim();
    if (flag) {
        return flag;
    }
    const env = process.env[USER_AGENT_ENV_VAR]?.trim();
    if (env) {
        return env;
    }
    return DEFAULT_USER_AGENT;
}

/** Extract the Chrome major version (e.g. "154") from a UA string, if present. */
export function chromeMajorFromUA(ua: string): string | undefined {
    return ua.match(/Chrome\/(\d+)/)?.[1];
}

/**
 * Build a matching `sec-ch-ua` client-hints header for a Chrome UA so the
 * header set stays self-consistent. Returns undefined for non-Chrome UAs
 * (caller should omit the header in that case).
 */
export function secChUaForUA(ua: string): string | undefined {
    const major = chromeMajorFromUA(ua);
    if (!major) {
        return undefined;
    }
    return `"Chromium";v="${major}", "Google Chrome";v="${major}", "Not/A)Brand";v="24"`;
}
