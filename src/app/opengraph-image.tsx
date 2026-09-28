import { ImageResponse } from "next/og";

// Generated at build time (no edge runtime), so the page can stay static.
export const alt = "Ujjwal Jain: backend and systems engineer";
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
                    justifyContent: "center",
                    padding: "80px",
                    backgroundColor: "#0B0F14",
                    fontFamily: "monospace",
                }}
            >
                <div
                    style={{
                        width: "60px",
                        height: "4px",
                        backgroundColor: "#4F8CFF",
                        marginBottom: "40px",
                        borderRadius: "2px",
                    }}
                />

                <div
                    style={{
                        fontSize: "84px",
                        fontWeight: 700,
                        color: "#E5E7EB",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.05,
                        marginBottom: "20px",
                    }}
                >
                    Ujjwal Jain
                </div>

                <div style={{ fontSize: "34px", color: "#4F8CFF", marginBottom: "28px" }}>
                    Backend &amp; systems engineering
                </div>

                <div style={{ fontSize: "26px", color: "#9CA3AF", lineHeight: 1.45, maxWidth: "860px" }}>
                    Databases, protocols and data pipelines built from scratch, with the tests and benchmarks behind them.
                </div>

                <div
                    style={{
                        position: "absolute",
                        bottom: "56px",
                        left: "80px",
                        fontSize: "20px",
                        color: "#9CA3AF",
                        letterSpacing: "0.08em",
                    }}
                >
                    ujjwaljain.vercel.app
                </div>
            </div>
        ),
        { ...size }
    );
}
