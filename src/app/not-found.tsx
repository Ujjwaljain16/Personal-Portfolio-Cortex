"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Home, Wifi } from "lucide-react";

export default function NotFound() {
    const [glitch, setGlitch] = useState(false);

    // Periodic glitch effect
    useEffect(() => {
        const interval = setInterval(() => {
            setGlitch(true);
            setTimeout(() => setGlitch(false), 150);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md px-4">
                {/* Error icon */}
                <div className="w-16 h-16 rounded-xl bg-(--danger)/10 border border-(--danger)/20 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-7 h-7 text-(--danger)" />
                </div>

                {/* Error code with glitch */}
                <div
                    className="font-mono text-[48px] font-bold text-(--danger) leading-none tracking-tight relative"
                    style={{
                        textShadow: glitch
                            ? "2px 0 #4F8CFF, -2px 0 #FF6B6B"
                            : "none",
                        transform: glitch ? "translateX(2px)" : "none",
                        transition: "transform 0.05s",
                    }}
                >
                    404
                </div>

                {/* Message */}
                <div className="space-y-2">
                    <h1 className="text-lg font-medium text-foreground">
                        Endpoint Not Found
                    </h1>
                    <p className="text-sm text-(--text-secondary) leading-relaxed">
                        The requested endpoint does not exist in this platform.
                        It may have been decommissioned or was never registered.
                    </p>
                </div>

                {/* Terminal-style error log */}
                <div className="surface-1 rounded-lg p-4 text-left space-y-2">
                    <div className="text-[11px] font-mono space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="text-(--danger)">ERROR</span>
                            <span className="text-(--text-muted)">ENDPOINT_NOT_FOUND</span>
                        </div>
                        <div className="text-(--text-muted)">
                            → requested path does not map to any monitored service
                        </div>
                        <div className="text-(--text-muted)">
                            → platform status: <span className="text-(--success)">OPERATIONAL</span> | endpoints: 9
                        </div>
                        <div className="flex items-center gap-1.5 text-(--text-muted) pt-1">
                            <Wifi className="w-3 h-3 text-(--success)" />
                            <span>health checks passing · uptime nominal</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                            bg-(--accent-primary) text-white hover:opacity-90 transition-opacity"
                    >
                        <Home className="w-3.5 h-3.5" />
                        Dashboard
                    </Link>
                    <Link
                        href="/system"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                            surface-1 text-(--text-secondary) hover:text-foreground hover:border-(--border-hover) transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        System Overview
                    </Link>
                </div>

                {/* Footer */}
                <div className="text-[10px] font-mono text-(--text-muted) opacity-50 uppercase tracking-wider">
                    cortex.system // error-handler
                </div>
            </div>
        </div>
    );
}
