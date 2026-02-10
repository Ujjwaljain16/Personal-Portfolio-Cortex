# ARCHITECTURE // CORTEX v2.0

> **System Design & Component Overview**

## 1. Design Philosophy

CORTEX is designed as a **Single Page Application (SPA) hybrid**, leveraging Next.js App Router for server-side optimization while maintaining a persistent, app-like state on the client.

The core architectural goal is **"Fluid Context"**—the ability to traverse between different domains (Architecture, Decisions, Code) without losing the user's mental model of the system.

## 2. Tech Stack

-   **Runtime:** Node.js (Next.js 15)
-   **Language:** TypeScript (Strict Mode)
-   **UI Engine:** React 19 + Framer Motion
-   **State Management:** Zustand
-   **Styling:** TailwindCSS (Utility-first)

## 3. Core Components

### 3.1. The Shell (`layout.tsx`)
The application shell enforces the "OS" metaphor. It persists across route transitions and manages global concerns:
-   **Sidebar:** Main navigation rail.
-   **ContextPanel:** Dynamic right-rail that changes content based on the active route and hover interactions.
-   **StatusBar:** Real-time health signals (simulated or real).

### 3.2. Context Engine (`ContextPanel.tsx`)
A unique pattern where the active route *injects* content into the global context panel.
-   **Mechanism:** Components use `useSystemStore` to set `contextPanelContent` on mount or hover.
-   **Benefit:** Decouples the main view (list of items) from the detail view (context panel), allowing for a high-density "master-detail" interface without easy-to-miss modals.

### 3.3. Boot Sequence (`BootSequence.tsx`)
A purely aesthetic but functionally important flow that sets the "Engineering Terminal" tone.
-   Uses `localStorage` to persist boot state (preventing repetitive animations).
-   Wraps the entire application children.

## 4. Data Architecture

Data is treated as **Static Knowledge**, co-located with the code.

-   **`src/data/`**: Source of truth for all modules.
    -   `decisions.ts`: ADRs (Architecture Decision Records).
    -   `experiments.ts`: Hypothesis and results.
    -   `deployments.ts`: Release log.
    -   `blogPosts.ts`: Technical articles.

*Why not a database?*
For this scale, a database adds latency and complexity. TypeScript files provide instant compilation-time validation and zero-latency reads.

## 5. Intelligent Simulation (`/ask`)

The "CTO Simulation" features a lightweight RAG (Retrieval-Augmented Generation) system.

-   **`knowledge.ts`**: A flattened, token-optimized text representation of the entire system's state (projects, decisions, philosophy).
-   **Prompt Engineering:** The system prompt instructs the LLM to roleplay as the specific engineer (Ujjwal), using *only* the provided context and refusing to hallucinate.

## 6. Directory Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── layout/          # Shell (Sidebar, ContextPanel)
│   ├── landing/         # Boot & Home
│   ├── system/          # Architecture viz
│   ├── decisions/       # ADR list & detail
│   ├── experiments/     # Metrics & charts
│   └── deployments/     # Release timeline
├── data/                # Static data (The "Database")
├── lib/                 # Utilities, hooks, stores
└── styles/              # Global CSS & Tailwind config
```
