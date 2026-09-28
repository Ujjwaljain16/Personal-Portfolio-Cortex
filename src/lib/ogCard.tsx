import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

interface CardInput {
    /** Small label above the title, e.g. "PROJECT" or "WRITING". */
    eyebrow: string;
    title: string;
    subtitle?: string;
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
function titleSize(title: string) {
    if (title.length <= 28) return 84;
    if (title.length <= 56) return 66;
    if (title.length <= 90) return 52;
    return 42;
}

/** The share card used for project and post pages. Generated at build time. */
export function renderCard(input: CardInput) {
    const eyebrow = cardText(input.eyebrow);
    const title = cardText(input.title);
    const subtitle = input.subtitle ? cardText(input.subtitle) : undefined;
    const chips = (input.chips ?? []).map(cardText).filter(Boolean);
    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    padding: "72px 80px",
                    backgroundColor: "#0B0F14",
                    fontFamily: "monospace",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "36px" }}>
                    <div style={{ width: "60px", height: "4px", backgroundColor: "#4F8CFF", borderRadius: "2px" }} />
                    <div style={{ fontSize: "24px", color: "#4F8CFF", letterSpacing: "0.14em" }}>{eyebrow}</div>
                </div>

                <div
                    style={{
                        display: "flex",
                        fontSize: `${titleSize(title)}px`,
                        fontWeight: 700,
                        color: "#E5E7EB",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.1,
                        maxWidth: "1040px",
                    }}
                >
                    {title}
                </div>

                {subtitle ? (
                    <div
                        style={{
                            display: "flex",
                            fontSize: "28px",
                            color: "#9CA3AF",
                            lineHeight: 1.4,
                            marginTop: "28px",
                            maxWidth: "980px",
                        }}
                    >
                        {subtitle.length > 170 ? `${subtitle.slice(0, 167)}...` : subtitle}
                    </div>
                ) : null}

                <div style={{ display: "flex", flex: 1 }} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: "14px" }}>
                        {chips.map((c) => (
                            <div
                                key={c}
                                style={{
                                    display: "flex",
                                    fontSize: "22px",
                                    color: "#E5E7EB",
                                    padding: "8px 18px",
                                    border: "1px solid #2A3441",
                                    borderRadius: "8px",
                                    backgroundColor: "#121821",
                                }}
                            >
                                {c}
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "flex", fontSize: "22px", color: "#9CA3AF", letterSpacing: "0.06em" }}>
                        Ujjwal Jain · ujjwaljain.vercel.app
                    </div>
                </div>
            </div>
        ),
        { ...OG_SIZE }
    );
}
