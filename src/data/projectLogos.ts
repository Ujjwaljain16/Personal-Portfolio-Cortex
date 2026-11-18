/**
 * Logos shown beside a project's name on its own page, in public/projects/<id>/: copied from each project's
 * repository, except MiniDB's (see below). Only projects with a real logo are listed: a default framework icon is not a logo, and a
 * project without one simply shows its name. Logos are kept off the lists (cards, rows, the home graph), where some
 * projects having one and others not would make the list uneven.
 *
 * `tile`: the logo brings its own background (an app icon or a mark on a rounded square), so it fills the frame.
 * Without it the logo is a transparent mark and sits inset on a quiet surface.
 */
export const PROJECT_LOGOS: Record<string, { src: string; tile?: boolean; from: string }> = {
    fuze: { src: "/projects/fuze/logo.svg", from: "Ujjwaljain16/Fuze frontend/public/favicon.svg" },
    campussync: { src: "/projects/campussync/logo.svg", from: "Ujjwaljain16/CampusSync my-app/public/logo-clean.svg" },
    campusslot: { src: "/projects/campusslot/logo.svg", tile: true, from: "Ujjwaljain16/campusslot docs/brand/campusslot-mark.svg (v2 branch, commit a2faecc)" },
    warrant: { src: "/projects/warrant/logo.svg", from: "Ujjwaljain16/Warrant docs/media/logo-icon.svg (commit 5fd66cc)" },
    // The one logo not taken from its repository: a small B+ tree (root, two leaf pages, the sibling pointer between them).
    minidb: { src: "/projects/minidb/logo.svg", tile: true, from: "made for this site; not in the MiniDB repository" },
    "sse-observatory": { src: "/projects/sse-observatory/logo.png", tile: true, from: "Ujjwaljain16/SSE-Observatory public/logo.png, resized" },
    vaulttabs: { src: "/projects/vaulttabs/logo.png", tile: true, from: "Ujjwaljain16/VaultTabs extension/public/icon-128.png" },
    spentsmart: { src: "/projects/spentsmart/logo.png", tile: true, from: "Ujjwaljain16/SpentSmart assets/images/icon.png, resized" },
};

export function projectLogo(id: string): { src: string; tile: boolean } | undefined {
    const logo = PROJECT_LOGOS[id];
    return logo && { src: logo.src, tile: !!logo.tile };
}
