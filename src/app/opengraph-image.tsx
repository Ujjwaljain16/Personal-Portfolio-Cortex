import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CORTEX | Ujjwal Jain — Engineering Portfolio";
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
                {/* Top accent line */}
                <div
                    style={{
                        width: "60px",
                        height: "4px",
                        backgroundColor: "#4F8CFF",
                        marginBottom: "40px",
                        borderRadius: "2px",
                    }}
                />

                {/* Title */}
                <div
                    style={{
                        fontSize: "64px",
                        fontWeight: 700,
                        color: "#E5E7EB",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.1,
                        marginBottom: "16px",
                    }}
                >
                    CORTEX
                </div>

                {/* Name */}
                <div
                    style={{
                        fontSize: "28px",
                        color: "#4F8CFF",
                        marginBottom: "24px",
                    }}
                >
                    Ujjwal Jain
                </div>

                {/* Description */}
                <div
                    style={{
                        fontSize: "22px",
                        color: "#9CA3AF",
                        lineHeight: 1.5,
                        maxWidth: "700px",
                    }}
                >
                    Backend Engineer • Systems Builder • AI Infrastructure
                </div>

                {/* Bottom bar */}
                <div
                    style={{
                        position: "absolute",
                        bottom: "60px",
                        left: "80px",
                        display: "flex",
                        gap: "32px",
                        fontSize: "14px",
                        color: "#6B7280",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                    }}
                >
                    <span>Systems</span>
                    <span>•</span>
                    <span>Decisions</span>
                    <span>•</span>
                    <span>Experiments</span>
                    <span>•</span>
                    <span>Deployments</span>
                </div>
            </div>
        ),
        { ...size }
    );
}
