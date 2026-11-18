import { ImageResponse } from "next/og";
import { SITE_HOST } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

/** The site's dark palette (globals.css), written out because share images are rendered outside the page's CSS. */
export const OG = {
    bg: "#090D12",
    surface: "#111923",
    border: "#222D39",
    text: "#E8EDF4",
    secondary: "#A3ADBB",
    muted: "#8B95A5",
    accent: "#63A5FF",
} as const;

interface CardInput {
    /** Small label above the title, e.g. "PROJECT" or "WRITING". */
    eyebrow: string;
    title: string;
    subtitle?: string;
    /** One measured number with its context, shown large (a project's headline). */
    metric?: { value: string; label: string };
    /** Short facts shown along the bottom, e.g. status and period. */
    chips?: string[];
}

/**
 * The image renderer fetches missing glyphs (emoji, other scripts) from a CDN at
 * build time. A build must not depend on the network, so cards only carry text the
 * built-in font can draw: emoji and other characters outside the basic planes are
 * dropped.
 */
export function cardText(text: string): string {
    return text
        .replace(/\p{Extended_Pictographic}|[\u{10000}-\u{10FFFF}]|[️‍]/gu, "")
        .replace(/\s{2,}/g, " ")
        .trim();
}

/** Titles get smaller as they get longer so they never overflow the card. */
function titleSize(title: string, withMetric: boolean) {
    const base = withMetric ? 0.82 : 1;
    if (title.length <= 28) return Math.round(80 * base);
    if (title.length <= 56) return Math.round(62 * base);
    if (title.length <= 90) return Math.round(50 * base);
    return Math.round(42 * base);
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 3).replace(/\s+\S*$/, "")}...` : text);

/** The brand mark and eyebrow along the top of every card. */
export function OgTopRow({ eyebrow }: { eyebrow: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "44px",
                        height: "44px",
                        borderRadius: "11px",
                        backgroundColor: OG.accent,
                    }}
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path d="M17.95 6.65 A8 8 0 1 0 17.95 17.35" stroke={OG.bg} strokeWidth="2.2" strokeLinecap="round" />
                        <path d="M15.16 9.16 A4.25 4.25 0 1 0 15.16 14.84" stroke={OG.bg} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
                        <circle cx="12" cy="12" r="1.6" fill={OG.bg} />
                        <circle cx="21" cy="12" r="1.3" fill={OG.bg} />
                    </svg>
                </div>
                <div style={{ display: "flex", fontSize: "22px", color: OG.text, letterSpacing: "0.22em", fontWeight: 700 }}>CORTEX</div>
            </div>
            <div style={{ display: "flex", fontSize: "20px", color: OG.muted, letterSpacing: "0.18em" }}>{eyebrow}</div>
        </div>
    );
}

/** The share card used for project, post and record pages. Generated at build time. */
export function renderCard(input: CardInput) {
    const eyebrow = cardText(input.eyebrow);
    const title = cardText(input.title);
    const subtitle = input.subtitle ? cardText(input.subtitle) : undefined;
    const metric = input.metric ? { value: cardText(input.metric.value), label: cardText(input.metric.label) } : undefined;
    const chips = (input.chips ?? []).map(cardText).filter(Boolean);
    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    padding: "64px 76px 56px",
                    backgroundColor: OG.bg,
                    backgroundImage: `radial-gradient(circle at 88% 12%, rgba(99, 165, 255, 0.14), rgba(9, 13, 18, 0) 48%)`,
                }}
            >
                <OgTopRow eyebrow={eyebrow} />

                <div
                    style={{
                        display: "flex",
                        marginTop: metric ? "48px" : "64px",
                        fontSize: `${titleSize(title, !!metric)}px`,
                        fontWeight: 700,
                        color: OG.text,
                        letterSpacing: "-0.03em",
                        lineHeight: 1.05,
                        maxWidth: "1040px",
                    }}
                >
                    {title}
                </div>

                {subtitle ? (
                    <div
                        style={{
                            display: "flex",
                            fontSize: metric ? "25px" : "28px",
                            color: OG.secondary,
                            lineHeight: 1.45,
                            marginTop: "22px",
                            maxWidth: "1000px",
                        }}
                    >
                        {clip(subtitle, metric ? 150 : 180)}
                    </div>
                ) : null}

                <div style={{ display: "flex", flex: 1 }} />

                {metric ? (
                    <div style={{ display: "flex", flexDirection: "column", borderTop: `1px solid ${OG.border}`, paddingTop: "26px", marginBottom: "30px" }}>
                        <div style={{ display: "flex", fontSize: "52px", fontWeight: 700, color: OG.text, letterSpacing: "-0.02em" }}>{metric.value}</div>
                        <div style={{ display: "flex", fontSize: "22px", color: OG.muted, marginTop: "8px", maxWidth: "1000px" }}>
                            {clip(metric.label, 110)}
                        </div>
                    </div>
                ) : null}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: "12px" }}>
                        {chips.map((c) => (
                            <div
                                key={c}
                                style={{
                                    display: "flex",
                                    fontSize: "19px",
                                    color: OG.secondary,
                                    padding: "7px 18px",
                                    border: `1px solid ${OG.border}`,
                                    borderRadius: "999px",
                                    letterSpacing: "0.04em",
                                }}
                            >
                                {c}
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "flex", fontSize: "20px", color: OG.muted, letterSpacing: "0.04em" }}>{`Ujjwal Jain · ${SITE_HOST}`}</div>
                </div>
            </div>
        ),
        { ...OG_SIZE }
    );
}
