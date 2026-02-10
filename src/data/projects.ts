export interface Project {
    id: string;
    name: string;
    status: "active" | "stable" | "archived" | "in-dev";
    description: string;
    tech: string[];
    architectureSummary: string;
    link?: string;
    repo: string;
}

export const projects: Project[] = [
    {
        id: "agentbrake",
        name: "AgentBrake",
        status: "active",
        description:
            "Safety control plane for AI agents that enforces real-time policy evaluation on tool calls using a transparent MCP proxy.",
        tech: [
            "TypeScript",
            "Node.js",
            "Docker",
            "JSON-RPC",
            "YAML Policy Engine"
        ],
        architectureSummary:
            "AI safety control plane designed to enforce real-time policy constraints on agent tool execution. Built around a transparent MCP proxy that intercepts and evaluates JSON-RPC tool calls before forwarding. Includes semantic filtering, budget enforcement, circuit breakers, and human-in-the-loop approvals. Designed to prevent unsafe agent actions while maintaining operational flexibility.",
        link: "https://github.com/Ujjwaljain16/AgentBrake",
        repo: "Ujjwaljain16/AgentBrake"
    },
    {
        id: "ecommerce-backend",
        name: "E-commerce Backend",
        status: "in-dev",
        description:
            "Distributed microservices backend implementing an event-driven e-commerce system with GraphQL gateway, gRPC services, and Kafka-based workflows.",
        tech: [
            "Go",
            "gRPC",
            "GraphQL",
            "Kafka",
            "PostgreSQL",
            "Redis",
            "Elasticsearch",
            "Kubernetes"
        ],
        architectureSummary:
            "Distributed microservices backend designed to orchestrate commerce workflows through event-driven communication. Built around gRPC services coordinated by a GraphQL gateway and Kafka event streams. Includes Redis caching, Prometheus instrumentation, centralized logging, and containerized deployment across Docker and Kubernetes. Designed to model scalable service boundaries with observable system behavior.",
        link: "https://github.com/Ujjwaljain16/E-commerce-Backend",
        repo: "Ujjwaljain16/E-commerce-Backend"
    },
    {
        id: "campussync",
        name: "CampusSync",
        status: "active",
        description:
            "Multi-tenant credential issuance and verification system for universities and recruiters, built around W3C Verifiable Credentials.",
        tech: [
            "Next.js 15",
            "React 19",
            "TypeScript",
            "PostgreSQL",
            "Supabase",
            "Gemini 1.5",
            "Tesseract.js"
        ],
        architectureSummary:
            "Credential trust infrastructure designed to manage verifiable academic credentials across multiple organizations. Built around a layered SaaS architecture with centralized middleware and database-enforced isolation using Row-Level Security. Includes cryptographic credential issuance, AI-assisted OCR pipelines, and role-based access control. Designed to guarantee data integrity and prevent cross-tenant leakage at scale.",
        link: "https://github.com/Ujjwaljain16/CampusSync",
        repo: "Ujjwaljain16/CampusSync"
    },
    {
        id: "fuze",
        name: "Fuze",
        status: "active",
        description:
            "AI-driven knowledge intelligence system that transforms saved content into a semantic, project-aware knowledge base with unified recommendation orchestration.",
        tech: [
            "Python",
            "Flask",
            "React",
            "PostgreSQL",
            "pgvector",
            "Redis",
            "Gemini API",
            "SentenceTransformers"
        ],
        architectureSummary:
            "AI knowledge intelligence system designed to transform fragmented content into a contextual recommendation engine. Built around semantic embeddings with pgvector and a unified orchestration layer routing across multiple recommendation strategies. Includes multi-layer caching, background processing workers, and encrypted per-user API key management. Designed to deliver low-latency AI insights while maintaining system resilience.",
        link: "https://github.com/Ujjwaljain16/Fuze",
        repo: "Ujjwaljain16/Fuze"
    },
    {
        id: "migratedb",
        name: "migrateDB",
        status: "stable",
        description:
            "TypeScript-first database migration engine with dependency-aware execution, rollback safety, and multi-database support.",
        tech: [
            "TypeScript",
            "Node.js",
            "CLI",
            "PostgreSQL",
            "MySQL",
            "SQLite"
        ],
        architectureSummary:
            "Developer tooling infrastructure designed to manage database schema evolution safely across environments. Built around dependency-aware migration execution using topological sorting and adapter-based database drivers. Includes checksum verification, transaction safety, environment filtering, and database-level locking. Designed to ensure deterministic migrations with zero runtime overhead.",
        link: "https://www.npmjs.com/package/@ujjwaljain16/migratedb",
        repo: "Ujjwaljain16/migratedb"
    },
    {
        id: "sheetsync",
        name: "SheetSync",
        status: "stable",
        description:
            "Resilient ETL pipeline that converts Google Sheets inputs into ACID-compliant PostgreSQL data streams with automated validation and transactional safety.",
        tech: [
            "Node.js",
            "Express",
            "PostgreSQL",
            "Google Apps Script",
            "Docker",
            "Joi Validation"
        ],
        architectureSummary:
            "Resilient ETL pipeline designed to convert spreadsheet inputs into ACID-compliant relational data streams. Built around Node.js streaming processors with Apps Script triggers and a centralized API gateway. Includes idempotent writes, transactional inbox patterns, materialized analytics views, and retry-based resilience. Designed to transform unreliable manual data entry into validated, production-safe workflows.",
        link: "https://github.com/Ujjwaljain16/SheetSync",
        repo: "Ujjwaljain16/SheetSync"
    },
    {
        id: "sse-observatory",
        name: "SSE-Observatory",
        status: "in-dev",
        description:
            "Real-time Server-Sent Events debugging tool with advanced filtering, time-travel playback, and proxy-based stream inspection.",
        tech: [
            "React",
            "TypeScript",
            "Vite",
            "Tailwind CSS",
            "EventSource API"
        ],
        architectureSummary:
            "Real-time stream debugging tool designed to inspect and replay high-volume Server-Sent Event pipelines. Built around an EventSource ingestion layer with a ring-buffer event store and time-travel playback engine. Includes proxy-based authentication handling, query-language filtering, and replayable timelines for deep inspection. Designed to provide visibility and control when debugging asynchronous event systems.",
        link: "https://github.com/Ujjwaljain16/SSE-Observatory",
        repo: "Ujjwaljain16/SSE-Observatory"
    },
    {
        id: "httpserver",
        name: "HttpServer",
        status: "stable",
        description:
            "Multi-threaded HTTP/1.1 server built from scratch using Python's standard library, focused on concurrency control, security hardening, and observability.",
        tech: [
            "Python",
            "Sockets",
            "Threading",
            "HTTP/1.1",
            "Prometheus Metrics"
        ],
        architectureSummary:
            "Low-level networking system designed to implement HTTP/1.1 behavior using Python standard libraries. Built around a bounded thread pool with custom request parsing and connection lifecycle management. Includes rate limiting, path validation, structured logging, and Prometheus-compatible metrics exposure. Designed to demonstrate controlled concurrency, security hardening, and observability without external frameworks.",
        repo: "Ujjwaljain16/HttpServer"
    },
    {
        id: "spentsmart",
        name: "SpentSmart",
        status: "active",
        description:
            "Privacy-first UPI expense tracker built for the Indian ecosystem with fully local data storage and offline-first architecture.",
        tech: [
            "React Native",
            "Expo",
            "TypeScript",
            "UPI Intent API",
            "Biometric Authentication"
        ],
        architectureSummary:
            "Privacy-first mobile architecture designed to track UPI expenses entirely on-device without cloud dependencies. Built around local-first storage with modular service layers handling analytics, security context, and UPI intent flows. Includes biometric authentication, offline-first state management, and isolated transaction handling. Designed to prioritize user privacy while maintaining responsive mobile performance.",
        link: "https://github.com/Ujjwaljain16/SpentSmart",
        repo: "Ujjwaljain16/SpentSmart"
    },
];

export interface Metric {
    id: string;
    label: string;
    value: string | number;
    trend: "up" | "down" | "neutral";
    trendValue: string;
    explanation: string;
}

export const systemMetrics: Metric[] = [
    {
        id: "uptime",
        label: "ENGINEERING TIME",
        value: "3+ Years",
        trend: "up",
        trendValue: "continuous",
        explanation:
            "Total time invested in full-stack engineering, distributed systems, and production-grade software development. Tracked from first commit to current system state.",
    },
    {
        id: "modules",
        label: "ACTIVE MODULES",
        value: 9,
        trend: "neutral",
        trendValue: "stable",
        explanation:
            "Core systems distributed across AI Safety, Distributed Backends, and SaaS Infrastructure (AgentBrake, E-commerce, CampusSync, etc.). Each module represents a distinct architectural domain.",
    },
    {
        id: "deploy",
        label: "COMMITS",
        value: "800+",
        trend: "up",
        trendValue: "across repos",
        explanation:
            "Total commits across all active repositories. Reflecting consistent engineering output and iterative development.",
    },
    {
        id: "focus",
        label: "CURRENT FOCUS",
        value: "System Design",
        trend: "up",
        trendValue: "Go / Spring",
        explanation:
            "Active learning path focusing on distributed systems patterns, scalability, and enterprise backend architectures (Go, Spring Boot).",
    },
];
