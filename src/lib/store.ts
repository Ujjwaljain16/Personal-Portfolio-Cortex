import { create } from "zustand";

interface SystemState {
    // Sidebar state
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;

    // Context panel
    contextPanelContent: ContextContent | null;
    setContextContent: (content: ContextContent | string | null) => void;

    // Active project card (persists glow until next hover)
    activeCardId: string | null;
    setActiveCard: (id: string | null) => void;

    // Selected items
    selectedDecisionId: string | null;
    setSelectedDecision: (id: string | null) => void;
    selectedExperimentId: string | null;
    setSelectedExperiment: (id: string | null) => void;
    selectedDeploymentId: string | null;
    setSelectedDeployment: (id: string | null) => void;
    selectedLogId: string | null;
    setSelectedLog: (id: string | null) => void;

    // Simulate founder mode
    simulateMode: boolean;
    simulateStep: number;
    setSimulateMode: (active: boolean) => void;
    setSimulateStep: (step: number) => void;

    // System Status
    systemStatus: "ONLINE" | "OFFLINE" | "DEGRADED";
    systemLatency: number;
    systemMode: "Stable" | "Dev" | "Debug";
    setSystemStatus: (status: "ONLINE" | "OFFLINE" | "DEGRADED") => void;
    updateLatency: () => void;

    // Interaction limits
    focusLocked: boolean;
    setFocusLocked: (locked: boolean) => void;

    // Settings (persisted to localStorage)
    darkMode: boolean;
    sounds: boolean;
    notifications: boolean;
    setDarkMode: (v: boolean) => void;
    setSounds: (v: boolean) => void;
    setNotifications: (v: boolean) => void;
    hydrateSettings: () => void;
}

export type ContextContent =
    | { type: "architecture"; title: string; architectureSummary: string; description?: string; tech?: string[] }
    | { type: "markdown"; content: string };

export const useSystemStore = create<SystemState>((set) => ({
    sidebarCollapsed: false,
    toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

    contextPanelContent: null,
    setContextContent: (content) =>
        set({
            contextPanelContent:
                content === null ? null :
                    typeof content === "string" ? { type: "markdown", content } : content
        }),

    activeCardId: null,
    setActiveCard: (id) => set({ activeCardId: id }),

    selectedDecisionId: null,
    setSelectedDecision: (id) => set({ selectedDecisionId: id }),
    selectedExperimentId: null,
    setSelectedExperiment: (id) => set({ selectedExperimentId: id }),
    selectedDeploymentId: null,
    setSelectedDeployment: (id) => set({ selectedDeploymentId: id }),
    selectedLogId: null,
    setSelectedLog: (id) => set({ selectedLogId: id }),
    simulateMode: false,
    simulateStep: 0,
    setSimulateMode: (active) => set({ simulateMode: active }),
    setSimulateStep: (step) => set({ simulateStep: step }),

    systemStatus: "ONLINE",
    systemLatency: 22,
    systemMode: "Stable",
    setSystemStatus: (status) => set({ systemStatus: status }),
    updateLatency: () =>
        set((state) => ({
            systemLatency: Math.max(
                10,
                Math.min(150, state.systemLatency + (Math.random() > 0.5 ? 2 : -2) * Math.floor(Math.random() * 5))
            ),
        })),

    focusLocked: false,
    setFocusLocked: (locked) => set({ focusLocked: locked }),

    darkMode: true,
    sounds: false,
    notifications: true,
    setDarkMode: (v) => {
        set({ darkMode: v });
        try { localStorage.setItem("pos-darkMode", JSON.stringify(v)); } catch { }
        if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("light", !v);
        }
    },
    setSounds: (v) => {
        set({ sounds: v });
        try { localStorage.setItem("pos-sounds", JSON.stringify(v)); } catch { }
    },
    setNotifications: (v) => {
        set({ notifications: v });
        try { localStorage.setItem("pos-notifications", JSON.stringify(v)); } catch { }
    },
    hydrateSettings: () => {
        try {
            const dm = localStorage.getItem("pos-darkMode");
            const snd = localStorage.getItem("pos-sounds");
            const ntf = localStorage.getItem("pos-notifications");
            const isDark = dm !== null ? JSON.parse(dm) : true;
            set({
                darkMode: isDark,
                sounds: snd !== null ? JSON.parse(snd) : false,
                notifications: ntf !== null ? JSON.parse(ntf) : true,
            });
            if (typeof document !== "undefined") {
                document.documentElement.classList.toggle("light", !isDark);
            }
        } catch { }
    },
}));
