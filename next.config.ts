import type { NextConfig } from "next";

// The address the site had before it moved to its own domain.
const OLD_HOST = "ujjwaljain.vercel.app";

/**
 * The new canonical origin, when NEXT_PUBLIC_SITE_URL names a different https origin
 * (same rules as src/lib/site.ts). Undefined while the site still lives at OLD_HOST.
 */
function movedTo(): string | undefined {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
    const valid = url.protocol === "https:" && url.pathname === "/" && !url.search && !url.hash;
    return valid && url.host !== OLD_HOST ? url.origin : undefined;
  } catch {
    return undefined;
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // After the move, the old address redirects every path to the new domain (308), so links
  // that were already shared keep working. Preview deployments use other hosts and are untouched.
  async redirects() {
    const origin = movedTo();
    if (!origin) return [];
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: OLD_HOST }],
        destination: `${origin}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
