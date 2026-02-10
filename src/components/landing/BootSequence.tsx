"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const BOOT_LINES = [
    { text: "initializing CORTEX core ...........", delay: 0 },
    { text: "connecting to endpoints ......... done", delay: 400 },
    { text: "loading monitoring agents ....... done", delay: 800 },
    { text: "verifying service health ........ done", delay: 1200 },
    { text: "syncing engineering telemetry ... done", delay: 1600 },
    { text: "platform ready.", delay: 2100, accent: true },
];

interface TypewriterProps {
    text: string;
    delay: number;
    speed?: number;
    accent?: boolean;
    onComplete?: () => void;
}

function Typewriter({ text, delay, speed = 22, accent, onComplete }: TypewriterProps) {
    const [displayed, setDisplayed] = useState("");
    const [started, setStarted] = useState(false);

    const done = started && displayed.length >= text.length;

    useEffect(() => {
        const startTimer = setTimeout(() => setStarted(true), delay);
        return () => clearTimeout(startTimer);
    }, [delay]);

    useEffect(() => {
        if (!started) return;
        if (displayed.length >= text.length) {
            onComplete?.();
            return;
        }
        const timer = setTimeout(() => {
            setDisplayed(text.slice(0, displayed.length + 1));
        }, speed);
        return () => clearTimeout(timer);
    }, [started, displayed, text, speed, onComplete]);

    if (!started) return <div className="h-5" />;

    return (
        <div className="flex items-center gap-0 h-5">
            <span className={accent ? "text-(--success) font-medium" : "text-(--text-muted)"}>
                {displayed}
            </span>
            {!done && (
                <span className="inline-block w-1.75 h-3.5 bg-(--accent-primary) ml-px animate-blink" />
            )}
        </div>
    );
}

export function BootSequence({ onComplete }: { onComplete: () => void }) {
    const [linesDone, setLinesDone] = useState(0);

    const handleLineDone = useCallback(() => {
        setLinesDone((prev) => prev + 1);
    }, []);

    useEffect(() => {
        if (linesDone >= 1) {
            const timer = setTimeout(onComplete, 600);
            return () => clearTimeout(timer);
        }
    }, [linesDone, onComplete]);

    return (
        <motion.div
            className="fixed inset-0 bg-background z-50 flex items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
        >
            <div className="w-full max-w-130 px-6">

                <div className="mb-6 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-(--danger) opacity-80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-(--warning) opacity-80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-(--success) opacity-80" />
                    <span className="text-[10px] font-mono text-(--text-muted) ml-2 opacity-50">
                        control.plane — boot
                    </span>
                </div>


                <div className="space-y-1 font-mono text-[13px]">
                    {BOOT_LINES.map((line, idx) => (
                        <Typewriter
                            key={idx}
                            text={line.text}
                            delay={line.delay}
                            accent={line.accent}
                            onComplete={idx === BOOT_LINES.length - 1 ? handleLineDone : undefined}
                        />
                    ))}
                </div>


                <div className="mt-8 h-0.5 bg-(--bg-surface-2) rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-(--accent-primary)"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2.6, ease: "easeInOut" }}
                    />
                </div>
            </div>
        </motion.div>
    );
}
