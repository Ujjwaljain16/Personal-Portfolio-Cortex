const DEFAULT_SITE_URL = "https://ujjwaljain.vercel.app";

/**
 * The canonical origin from a raw setting: https only, no path, no trailing slash.
 * Anything else (unset, malformed, http, a path) falls back to the default, so a bad
 * value can never break the build or publish a wrong canonical URL.
 */
export function resolveSiteUrl(raw: string | undefined): string {
    if (!raw) return DEFAULT_SITE_URL;
    try {
        const url = new URL(raw.trim());
        if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash) return DEFAULT_SITE_URL;
        return url.origin;
    } catch {
        return DEFAULT_SITE_URL;
    }
}

/**
 * Canonical origin of the deployed site (no trailing slash). Moving to another domain is a
 * setting, not a code change: set NEXT_PUBLIC_SITE_URL (for example https://ujjwaljain16.me)
 * in the host's environment and redeploy. It is read at build time.
 */
export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

/** The host part of SITE_URL, for text on share images. */
export const SITE_HOST = new URL(SITE_URL).host;
