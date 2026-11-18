import { ImageResponse } from "next/og";
import { SITE_HOST } from "@/lib/site";
import { OG, OgTopRow } from "@/lib/ogCard";

// Generated at build time (no edge runtime), so the page can stay static.
export const alt = "Ujjwal Jain: computer science, backend, systems and applied AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
                    backgroundImage: `radial-gradient(circle at 82% 30%, rgba(99, 165, 255, 0.16), rgba(9, 13, 18, 0) 50%)`,
                }}
            >
                <OgTopRow eyebrow="PORTFOLIO" />

                <div style={{ display: "flex", flex: 1 }} />

                <div style={{ display: "flex", fontSize: "22px", color: OG.muted, letterSpacing: "0.16em", marginBottom: "22px" }}>
                    COMPUTER SCIENCE · BACKEND · SYSTEMS · APPLIED AI
                </div>
                <div style={{ display: "flex", fontSize: "96px", fontWeight: 700, color: OG.text, letterSpacing: "-0.04em", lineHeight: 1 }}>
                    Ujjwal Jain
                </div>
                <div style={{ display: "flex", fontSize: "34px", color: OG.secondary, lineHeight: 1.4, marginTop: "26px", maxWidth: "900px" }}>
                    I like understanding how things work beneath the surface, and building them myself.
                </div>

                <div style={{ display: "flex", flex: 1 }} />

                <div style={{ display: "flex", borderTop: `1px solid ${OG.border}`, paddingTop: "24px", fontSize: "20px", color: OG.muted, letterSpacing: "0.04em" }}>
                    {SITE_HOST}
                </div>
            </div>
        ),
        { ...size }
    );
}
