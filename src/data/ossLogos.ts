/**
 * Logos for the open-source projects on the home page: each GitHub organisation's own avatar, downloaded once into
 * public/oss/<owner>.png so the page never loads images from GitHub. A project whose owner is not listed here simply
 * shows no logo.
 */
const OWNERS_WITH_LOGO = new Set(["kubernetes-sigs", "metacoglabs", "apache", "vitest-dev", "appwrite"]);

/** The logo for the repository a pull-request URL points into, or undefined. */
export function ossLogo(prUrl: string): string | undefined {
    const owner = new URL(prUrl).pathname.split("/")[1]?.toLowerCase();
    return owner && OWNERS_WITH_LOGO.has(owner) ? `/oss/${owner}.png` : undefined;
}
