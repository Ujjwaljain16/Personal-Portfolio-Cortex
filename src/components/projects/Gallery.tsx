import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Gallery as GalleryData } from "@/data/projects";

const LAYOUT = {
    wide: { grid: "grid-cols-1 sm:grid-cols-2", frame: "", sizes: "(min-width: 768px) 360px, 100vw", crop: false },
    tall: { grid: "grid-cols-1 sm:grid-cols-2", frame: "aspect-4/3", sizes: "(min-width: 768px) 360px, 100vw", crop: true },
    phone: { grid: "grid-cols-2 sm:grid-cols-4", frame: "", sizes: "(min-width: 768px) 170px, 45vw", crop: false },
} as const;

/**
 * Screenshots copied from the project's own repository. Tall full-page
 * captures are cropped to the top; each opens at full size in a new tab.
 */
export function Gallery({ gallery }: { gallery: GalleryData }) {
    const cfg = LAYOUT[gallery.layout];

    return (
        <ul className={cn("grid gap-3", cfg.grid)}>
            {gallery.items.map((img) => (
                <li key={img.src}>
                    <a
                        href={img.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${img.alt} (opens full size in a new tab)`}
                        className={cn(
                            "block overflow-hidden rounded-lg border border-(--border-default) bg-(--bg-surface-2) hover:border-(--accent-primary)",
                            cfg.frame
                        )}
                    >
                        <Image
                            src={img.src}
                            alt=""
                            width={img.width}
                            height={img.height}
                            sizes={cfg.sizes}
                            className={cn("w-full h-auto", cfg.crop && "h-full object-cover object-top")}
                        />
                    </a>
                </li>
            ))}
        </ul>
    );
}
