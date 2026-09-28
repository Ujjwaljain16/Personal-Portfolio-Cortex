export type ExperimentCategory = "Architecture" | "Performance" | "Security" | "Infra";

export interface Experiment {
    id: string;
    title: string;
    project: string;
    decision: "shipped" | "iterated" | "killed" | "experimental";
    hypothesis: string;
    variants: {
        control: string;
        variant: string;
    };
    impact: string;
    category: ExperimentCategory;
    signals: string[];
    linkedDecisionId?: string;
    riskLevel: "Low" | "Medium" | "High";
    surfaceArea: string;
    evidence?: string;
    notes?: string;
    reasonKilled?: string;
    lesson?: string;
}

export const experiments: Experiment[] = [
    {
        id: "EXP-01",
        title: "LLM-first OCR vs Regex Pipeline",
        project: "CampusSync",
        decision: "iterated",
        hypothesis:
            "Structured LLM extraction would outperform handcrafted regex parsing for complex certificate layouts.",
        variants: {
            control: "Pure regex extraction across ~30 field patterns with OCR artifact correction.",
            variant:
                "Gemini-powered LLM extractor with structured JSON prompts and regex fallback cascade.",
        },
        impact:
            "Neither strategy alone was sufficient. Final system shipped as a dual-path architecture combining LLM reasoning with deterministic fallback extraction.",
        category: "Architecture",
        signals: [
            "LLM integration introduced fallback architecture",
            "Regex engine retained for determinism",
            "Indicates shift from heuristic-first → hybrid AI pipeline",
        ],
        linkedDecisionId: "ADR-09",
        riskLevel: "Medium",
        surfaceArea: "OCR / Credential Extraction",
    },
    {
        id: "EXP-02",
        title: "Multi-strategy OCR Field Scoring",
        project: "CampusSync",
        decision: "shipped",
        hypothesis:
            "Combining multiple extraction heuristics and selecting via confidence scoring would outperform single-pass parsing.",
        variants: {
            control: "Single extractFromText regex pipeline.",
            variant:
                "Pattern + context + keyword + structural analysis merged using scoreFieldCandidate heuristics.",
        },
        impact:
            "Improved robustness across diverse certificate formats without adding ML dependency.",
        category: "Architecture",
        signals: [
            "Multi-strategy scoring replaced single-pass extraction",
            "Confidence-based selection enables graceful degradation",
            "No ML dependency — pure algorithmic approach",
        ],
        linkedDecisionId: "ADR-09",
        riskLevel: "Low",
        surfaceArea: "OCR / Field Extraction",
    },
    {
        id: "EXP-03",
        title: "Triple Supabase Client Architecture",
        project: "CampusSync",
        decision: "iterated",
        hypothesis:
            "Separating browser, server, and admin Supabase clients would resolve SSR/CSR auth boundary issues in Next.js.",
        variants: {
            control: "Single shared Supabase client across environments.",
            variant:
                "Browser singleton + cookie-based server client + service-role admin client with PKCE auth flow.",
        },
        impact:
            "Prevented service-role leakage to frontend and stabilized authentication across middleware and API routes.",
        category: "Security",
        signals: [
            "SSR/CSR boundary required explicit client separation",
            "Service-role isolation prevents credential leakage",
            "PKCE flow adoption for auth security",
        ],
        linkedDecisionId: "ADR-11",
        riskLevel: "High",
        surfaceArea: "Auth / Client Architecture",
    },
    {
        id: "EXP-04",
        title: "Composable API Middleware Stack",
        project: "CampusSync",
        decision: "shipped",
        hypothesis:
            "Functional composition of middleware would reduce duplicated auth and validation logic across API routes.",
        variants: {
            control: "Per-route authentication and error handling logic.",
            variant:
                "compose(withErrorHandler, withAuth, withRole) middleware pipeline with standardized responses.",
        },
        impact:
            "Routes reduced to pure business logic while enforcing consistent error classification and auth checks.",
        category: "Architecture",
        signals: [
            "Functional composition over inheritance for middleware",
            "Standardized error classification across all routes",
            "Auth logic centralized — single point of enforcement",
        ],
        linkedDecisionId: "ADR-12",
        riskLevel: "Low",
        surfaceArea: "API / Middleware Layer",
    },
    {
        id: "EXP-05",
        title: "In-Memory CacheManager vs External Redis",
        project: "CampusSync",
        decision: "shipped",
        hypothesis:
            "Process-local caching would provide sufficient performance gains without adding Redis infrastructure.",
        variants: {
            control: "Direct Supabase queries without caching.",
            variant:
                "Singleton CacheManager with TTL presets, memoize decorator, and stale-while-revalidate pattern.",
        },
        impact:
            "Reduced repeated queries while maintaining zero external dependencies for edge deployment.",
        category: "Performance",
        signals: [
            "Avoided external cache infrastructure (Redis) entirely",
            "Stale-while-revalidate pattern for edge compatibility",
            "Memoize decorator enables per-function cache control",
        ],
        linkedDecisionId: "ADR-14",
        riskLevel: "Low",
        surfaceArea: "Caching / Query Optimization",
    },
    {
        id: "EXP-06",
        title: "Middleware-based Multi-Tenant Isolation",
        project: "CampusSync",
        decision: "shipped",
        hypothesis:
            "Layered org context resolution combined with RLS would provide stronger tenant isolation than app-level filtering alone.",
        variants: {
            control: "Single-tenant assumptions with role checks.",
            variant:
                "Middleware org resolution + API context + post-query validation against RLS results.",
        },
        impact:
            "Three-layer defense prevented cross-tenant leakage and enabled recruiter cross-org access modeling.",
        category: "Security",
        signals: [
            "Three-layer tenant isolation defense in depth",
            "RLS as enforcement layer — not just app-level filtering",
            "Cross-org access modeling for recruiter workflows",
        ],
        linkedDecisionId: "ADR-15",
        riskLevel: "High",
        surfaceArea: "Multi-Tenancy / Data Isolation",
    },

    // Fuze Experiments
    {
        id: "EXP-07",
        title: "Hybrid recommendation orchestrator with fallback hierarchy",
        project: "Fuze",
        decision: "shipped",
        hypothesis:
            "A layered orchestrator combining semantic engines, contextual ranking, and LLM intent analysis would provide resilient recommendations even when subsystems fail.",
        variants: {
            control:
                "Single-pass recommendation flow with no engine abstraction or failure isolation.",
            variant:
                "Unified orchestrator coordinating FastSemanticEngine, ContextAwareEngine, Gemini analyzers, and hash-based embedding fallbacks guarded by feature availability flags.",
        },
        impact:
            "Recommendation flow became failure-tolerant; degraded components no longer blocked the pipeline, preserving system continuity under partial outages.",
        category: "Architecture",
        signals: [
            "Multi-engine orchestration with per-engine failure isolation",
            "Hash-based embedding fallback ensures pipeline continuity",
            "Feature flags gate subsystem availability at runtime",
        ],
        linkedDecisionId: "ADR-FZ-02",
        riskLevel: "Medium",
        surfaceArea: "ML / Recommendation Pipeline",
        evidence:
            "backend/ml/unified_recommendation_orchestrator.py — conditional imports, fallback embedding, per-user Gemini analyzer cache.",
        notes:
            "Fallback embedding uses normalized hash vectors — low quality but ensures pipeline continuity.",
    },
    {
        id: "EXP-08",
        title: "Lazy-loaded embedding model with multi-model fallback chain",
        project: "Fuze",
        decision: "shipped",
        hypothesis:
            "Deferring embedding model loading until first use would prevent startup crashes on low-memory environments.",
        variants: {
            control:
                "Embedding model loaded during module import, causing OOM failures on free-tier hosts.",
            variant:
                "Thread-safe lazy singleton with ordered fallback models and cache recovery logic; DISABLE_EMBEDDINGS environment kill switch.",
        },
        impact:
            "Application startup became infrastructure-agnostic, enabling deployment on constrained hosts without sacrificing embedding capability.",
        category: "Infra",
        signals: [
            "Lazy initialization eliminates startup OOM on constrained hosts",
            "Ordered model fallback chain adapts to available memory",
            "Environment kill switch for embedding-free degraded mode",
        ],
        riskLevel: "Medium",
        surfaceArea: "ML / Model Lifecycle",
        evidence:
            "backend/utils/embedding_utils.py — lazy initialization, model fallback chain, corrupted cache recovery.",
        notes:
            "UniversalSemanticMatcher mirrors the same lazy-loading strategy.",
    },
    {
        id: "EXP-09",
        title: "Multi-strategy scraping with scored content candidates",
        project: "Fuze",
        decision: "shipped",
        hypothesis:
            "Running multiple scraping strategies and scoring extracted candidates would outperform a single BeautifulSoup pipeline across diverse site structures.",
        variants: {
            control:
                "Single HTML extraction strategy with no quality scoring.",
            variant:
                "ScraplingEnhancedScraper executing semantic HTML detection, class-pattern matching, largest-text heuristics, and fallback extraction, selecting highest-scoring result.",
        },
        impact:
            "Content ingestion became adaptive to different domain layouts, improving robustness without introducing external ML dependencies.",
        category: "Architecture",
        signals: [
            "Multi-strategy extraction with quality scoring selection",
            "Adaptive to unknown site structures without ML",
            "Extensive import error handling reflects production hardening",
        ],
        riskLevel: "Low",
        surfaceArea: "Scraping / Content Ingestion",
        evidence:
            "backend/scrapers/scrapling_enhanced_scraper.py — multi-strategy pipeline and _score_content_quality().",
        notes:
            "Extensive import error handling reflects repeated production dependency failures.",
    },
    {
        id: "EXP-10",
        title: "RQ task queue with threading fallback",
        project: "Fuze",
        decision: "shipped",
        hypothesis:
            "Redis Queue workers would provide more reliable background processing than in-process threads while maintaining a fallback path when Redis is unavailable.",
        variants: {
            control:
                "Thread-based background processing with no persistence or retry logic.",
            variant:
                "RQ queue with retry/backoff, dedicated worker process, burst mode support, and automatic fallback to threading when Redis is unavailable.",
        },
        impact:
            "Background processing became resilient to worker crashes and deploy restarts while preserving zero-infra compatibility during degraded states.",
        category: "Infra",
        signals: [
            "RQ provides persistence and retry that threads lack",
            "Automatic threading fallback preserves zero-infra mode",
            "Three-tier Redis connection strategy for environment portability",
        ],
        linkedDecisionId: "ADR-FZ-05",
        riskLevel: "Medium",
        surfaceArea: "Background Processing / Task Queue",
        evidence:
            "backend/services/task_queue.py, backend/worker.py, start.sh worker lifecycle logic.",
        notes:
            "Three-tier Redis connection strategy allows seamless local → hosted transitions.",
    },
    {
        id: "EXP-11",
        title: "Active Revocation List for API key invalidation",
        project: "Fuze",
        decision: "shipped",
        hypothesis:
            "Maintaining a Redis-backed revocation set would eliminate stale API key validation caused by caching layers.",
        variants: {
            control:
                "API key removal relied on DB updates and in-memory cache clearing, allowing revoked keys to remain temporarily valid.",
            variant:
                "Redis-based revocation manager using SHA-256 key hashes with O(1) membership checks executed before cache validation.",
        },
        impact:
            "Security layer became instantly reactive to revocations while maintaining minimal latency overhead.",
        category: "Security",
        signals: [
            "O(1) revocation check before cache validation",
            "SHA-256 hashed keys prevent raw credential storage",
            "Fail-open behavior as intentional operational tradeoff",
        ],
        linkedDecisionId: "ADR-FZ-06",
        riskLevel: "High",
        surfaceArea: "Auth / API Key Security",
        evidence:
            "backend/services/api_key_revocation_manager.py — SADD/SISMEMBER flow and fail-open design.",
        notes:
            "Fail-open behavior documented as intentional operational tradeoff.",
    },
    {
        id: "EXP-12",
        title: "IPv4-resolved database connection manager",
        project: "Fuze",
        decision: "shipped",
        hypothesis:
            "Resolving Supabase hostnames to IPv4 and adding health-check recovery would eliminate infrastructure-specific connection failures.",
        variants: {
            control:
                "Direct SQLAlchemy engine creation using IPv6 resolution, causing intermittent network failures on Render.",
            variant:
                "DatabaseConnectionManager enforcing IPv4 resolution, thread-safe engine creation, periodic connection health checks, and SSL negotiation handling.",
        },
        impact:
            "Database layer became self-healing and infrastructure-aware, preventing cascading outages during network instability.",
        category: "Infra",
        signals: [
            "IPv4 enforcement resolved Render-specific IPv6 failures",
            "Self-healing connection pool with periodic health checks",
            "SSL negotiation handling for managed DB providers",
        ],
        riskLevel: "High",
        surfaceArea: "Database / Connection Management",
        evidence:
            "backend/utils/database_connection_manager.py — IPv4 resolution logic and connection health checks.",
        notes:
            "Explicit comment notes IPv6 caused production failures.",
    },
    {
        id: "EXP-13",
        title: "Row-Level Security as opt-in hardening layer",
        project: "Fuze",
        decision: "shipped",
        hypothesis:
            "Database-level RLS would provide defense-in-depth beyond application middleware isolation.",
        variants: {
            control:
                "User isolation enforced solely through middleware decorators and query filtering.",
            variant:
                "Opt-in migration enabling PostgreSQL RLS policies across core tables with idempotent setup and environment gating.",
        },
        impact:
            "Security model gained a secondary enforcement boundary without forcing immediate migration risk.",
        category: "Security",
        signals: [
            "Defense-in-depth: RLS as secondary enforcement boundary",
            "Opt-in migration avoids forced breaking changes",
            "Environment gating enables staged rollout",
        ],
        riskLevel: "Medium",
        surfaceArea: "Database / Access Control",
        evidence:
            "backend/utils/database_security_migration.py and init_db.py environment gate.",
        notes:
            "RLS intentionally optional due to pooling and deployment complexity.",
    },

    // SpentSmart Experiments
    {
        id: "EXP-14",
        title: "Custom Expo Native Module for UPI Intent",
        project: "SpentSmart",
        decision: "shipped",
        hypothesis:
            "Direct Android Intent access via a custom Expo native module would provide more reliable UPI launches than generic Linking APIs.",
        variants: {
            control:
                "expo-linking openURL with no package targeting, no installed-app discovery, and unreliable behavior on Android 11+.",
            variant:
                "Custom Kotlin Expo module exposing async functions for package-targeted launch, QR sharing, and PackageManager-based app discovery with FileProvider support.",
        },
        impact:
            "Payment launches became deterministic across different UPI apps without relying on fragile URL schemes.",
        category: "Architecture",
        signals: [
            "Custom native module bypasses Linking API limitations",
            "Package-targeted intent ensures deterministic UPI launches",
            "FileProvider support for cross-app QR image sharing",
        ],
        riskLevel: "Medium",
        surfaceArea: "Payments / Native Bridge",
        evidence:
            "modules/upi-intent/android/.../UpiIntentModule.kt and config plugin injection.",
        notes:
            "iOS implementation intentionally omitted — UPI ecosystem is Android-first.",
    },
    {
        id: "EXP-15",
        title: "Tiered UPI App Discovery System",
        project: "SpentSmart",
        decision: "shipped",
        hypothesis:
            "A multi-layer discovery pipeline would maintain UPI detection reliability across Expo Go and native builds.",
        variants: {
            control:
                "Hardcoded app list checked via Linking.canOpenURL, producing inconsistent results on Android 11+.",
            variant:
                "Native PackageManager query as primary discovery with Linking fallback when native module is unavailable.",
        },
        impact:
            "App discovery became environment-agnostic while avoiding false positives from outdated scheme checks.",
        category: "Infra",
        signals: [
            "Tiered discovery adapts to Expo Go vs native build environments",
            "PackageManager query replaces unreliable scheme checks",
            "Graceful degradation preserves dev-build compatibility",
        ],
        riskLevel: "Low",
        surfaceArea: "Payments / App Discovery",
        evidence:
            "services/upi-app-launcher.ts getInstalledUPIApps().",
        notes:
            "Tiered strategy allows graceful degradation during development builds.",
    },
    {
        id: "EXP-16",
        title: "Heuristic Payment Confidence Scoring",
        project: "SpentSmart",
        decision: "iterated",
        hypothesis:
            "Time spent in UPI apps combined with historical behavior could estimate payment success probability without external APIs.",
        variants: {
            control:
                "Binary user confirmation with no contextual intelligence.",
            variant:
                "Confidence score derived from app session duration, historical EMA patterns, and transaction size heuristics with UI-driven feedback.",
        },
        impact:
            "Reduced user friction by dynamically adjusting confirmation prompts based on inferred confidence.",
        category: "Architecture",
        signals: [
            "Heuristic scoring replaces binary confirmation flow",
            "EMA-based historical patterns inform confidence estimation",
            "Active iteration suggests convergence toward simpler model",
        ],
        riskLevel: "Medium",
        surfaceArea: "Payments / Verification UX",
        evidence:
            "services/payment-verification.ts and hooks/usePaymentConfirmation.ts.",
        notes:
            "Presence of two implementations suggests active iteration toward a simpler model.",
    },
    {
        id: "EXP-17",
        title: "Per-App UPI Launch Strategy Dispatch",
        project: "SpentSmart",
        decision: "shipped",
        hypothesis:
            "Different UPI apps require specialized launch flows; a unified strategy would fail for certain providers.",
        variants: {
            control:
                "Single upi:// launch flow for all apps.",
            variant:
                "Strategy dispatcher: QR image sharing for Google Pay, native launcher callbacks for PhonePe/Paytm, system chooser fallback for others.",
        },
        impact:
            "Improved compatibility across the fragmented Indian UPI ecosystem without adding server infrastructure.",
        category: "Architecture",
        signals: [
            "Strategy pattern dispatches per-app launch flows",
            "QR image share emerged as most reliable Google Pay trigger",
            "System chooser fallback covers unknown UPI providers",
        ],
        riskLevel: "Low",
        surfaceArea: "Payments / UPI Compatibility",
        evidence:
            "components/payment/QRPaymentGenerator.tsx and silent-qr-share pipeline.",
        notes:
            "QR image share emerged as the most reliable trigger for Google Pay.",
    },
    {
        id: "EXP-18",
        title: "Raw QR Parameter Preservation",
        project: "SpentSmart",
        decision: "shipped",
        hypothesis:
            "Rebuilding merchant QR URLs breaks cryptographic signatures; preserving original encoding ensures payment validity.",
        variants: {
            control:
                "Standard URLSearchParams decoding and rebuilding of query strings.",
            variant:
                "Dual parsing strategy preserving raw encoded parameters alongside structured parsing for UI display.",
        },
        impact:
            "Resolved merchant QR failures caused by signature invalidation during URL reconstruction.",
        category: "Security",
        signals: [
            "Cryptographic signature preservation during QR parsing",
            "Dual parse: raw for payment integrity, structured for UI",
            "Bug fix driven by real-world merchant transaction failures",
        ],
        riskLevel: "High",
        surfaceArea: "Payments / QR Parsing",
        evidence:
            "services/upi-parser.ts manual query parsing logic.",
        notes:
            "Bug fix originated from failed real-world merchant transactions.",
    },
    {
        id: "EXP-19",
        title: "Local-First Zero-Backend Architecture",
        project: "SpentSmart",
        decision: "shipped",
        hypothesis:
            "A fully offline finance tracker could eliminate privacy concerns and infrastructure overhead.",
        variants: {
            control:
                "Traditional expense tracker with server backend and cloud storage.",
            variant:
                "AsyncStorage-based persistence, biometric lock, privacy masking, and on-device analytics with no backend dependency.",
        },
        impact:
            "Delivered a privacy-first financial app with zero server cost and minimal attack surface.",
        category: "Security",
        signals: [
            "Zero-backend architecture eliminates server attack surface",
            "Biometric + privacy masking for sensitive financial data",
            "On-device analytics preserves user data sovereignty",
        ],
        riskLevel: "Low",
        surfaceArea: "Architecture / Privacy",
        evidence:
            "services/storage.ts, contexts/security-context.tsx, PRIVACY.md.",
        notes:
            "Privacy dashboard exposes storage footprint via local size estimation.",
    },
    {
        id: "EXP-20",
        title: "Multi-Channel Payment Intent Capture",
        project: "SpentSmart",
        decision: "shipped",
        hypothesis:
            "Monitoring QR scans, deep links, and clipboard data simultaneously would maximize transaction capture coverage.",
        variants: {
            control:
                "Single QR scanner input flow.",
            variant:
                "Parallel listeners for camera QR scans, deep-link intents, and clipboard detection with manual fallback.",
        },
        impact:
            "Expanded payment detection coverage without requiring SMS permissions or invasive monitoring.",
        category: "Architecture",
        signals: [
            "Multi-channel capture maximizes transaction detection",
            "No SMS or invasive permissions required",
            "Clipboard detection gated behind user confirmation",
        ],
        riskLevel: "Low",
        surfaceArea: "Payments / Input Capture",
        evidence:
            "services/intent-monitor.ts and LocalUpiTracker.",
        notes:
            "Clipboard detection gated behind user confirmation to avoid intrusive behavior.",
    },
    {
        id: "EXP-21",
        title: "Bharat QR Early-Exit Detection",
        project: "SpentSmart",
        decision: "shipped",
        hypothesis:
            "Detecting EMV-format Bharat QR codes early would prevent parsing failures and allow native UPI apps to handle them directly.",
        variants: {
            control:
                "Attempting to parse all QR codes as upi:// URLs.",
            variant:
                "Guard clause detecting non-UPI formats and passing raw QR data directly to UPI apps.",
        },
        impact:
            "Prevented parser crashes while supporting merchant EMV QR workflows common in Indian retail.",
        category: "Architecture",
        signals: [
            "Early-exit guard prevents parser crashes on non-UPI formats",
            "EMV QR passthrough supports Bharat QR merchant workflows",
            "Defensive parsing hardened from production failures",
        ],
        riskLevel: "Low",
        surfaceArea: "Payments / QR Detection",
        evidence:
            "services/upi-parser.ts early exit logic.",
        notes:
            "Likely introduced after encountering production parsing failures.",
    },

    // MigrateDB Experiments
    {
        id: "EXP-22",
        title: "Migration Interface → DatabaseAdapter Rewrite",
        project: "MigrateDB",
        decision: "shipped",
        hypothesis:
            "A broader DatabaseAdapter abstraction would enable rollback support, transactions, and multi-database compatibility beyond the original Migration interface.",
        variants: {
            control:
                "Legacy Migration interface with limited methods and no transaction support.",
            variant:
                "DatabaseAdapter interface introducing transaction lifecycle, database type awareness, and timestamped version tracking with upsert semantics.",
        },
        impact:
            "Unlocked rollback support and multi-engine compatibility while introducing a controlled breaking change.",
        category: "Architecture",
        signals: [
            "Interface redesign as controlled breaking change",
            "Transaction lifecycle support at adapter level",
            "Upsert semantics for version tracking",
        ],
        linkedDecisionId: "ADR-MG-01",
        riskLevel: "High",
        surfaceArea: "Core / Adapter Interface",
        evidence:
            "src/database/DatabaseAdapter.ts and legacy db/podil interface.",
        notes:
            "Legacy Migration files preserved for backward compatibility during transition.",
    },
    {
        id: "EXP-23",
        title: "Postgres-Only → Multi-Database Adapter Factory",
        project: "MigrateDB",
        decision: "shipped",
        hypothesis:
            "Adapter routing based on connection string prefixes would allow multi-database support without changing public APIs.",
        variants: {
            control:
                "Hardcoded PostgreSQL-only migration implementation.",
            variant:
                "AdapterFactory resolving postgres, mysql, and sqlite adapters dynamically from URL scheme.",
        },
        impact:
            "Expanded adoption surface while preserving zero-config upgrades for existing Postgres users.",
        category: "Architecture",
        signals: [
            "Factory pattern routes adapters from connection URL scheme",
            "Zero-config upgrade path for existing Postgres users",
            "MySQL adapter handles driver-specific statement splitting",
        ],
        linkedDecisionId: "ADR-MG-02",
        riskLevel: "Medium",
        surfaceArea: "Database / Multi-Engine Support",
        evidence:
            "src/database/AdapterFactory.ts and adapter implementations.",
        notes:
            "MySQL adapter manually splits statements due to driver limitations.",
    },
    {
        id: "EXP-24",
        title: "Transaction-Wrapped Migration Execution",
        project: "MigrateDB",
        decision: "shipped",
        hypothesis:
            "Wrapping migration batches in transactions would prevent inconsistent schema states during partial failures.",
        variants: {
            control:
                "Sequential migration execution without rollback safety.",
            variant:
                "supportsTransactions() detection with begin/commit/rollback orchestration inside MigrationEngine.",
        },
        impact:
            "Atomic schema evolution across supported databases.",
        category: "Infra",
        signals: [
            "Capability detection before transaction wrapping",
            "Atomic batch execution prevents partial schema states",
            "inTransaction state tracking avoids nested transaction bugs",
        ],
        linkedDecisionId: "ADR-MG-03",
        riskLevel: "Medium",
        surfaceArea: "Core / Execution Engine",
        evidence:
            "src/core/MigrationEngine.ts transaction handling logic.",
        notes:
            "Adapters track inTransaction state to avoid nested transaction issues.",
    },
    {
        id: "EXP-25",
        title: "Database-Table Advisory Locking",
        project: "MigrateDB",
        decision: "iterated",
        hypothesis:
            "Database-level locking would prevent concurrent migration processes across distributed environments.",
        variants: {
            control:
                "No concurrency protection in original engine.",
            variant:
                "Single-row lock table using CHECK(id = 1) constraint with insert/delete semantics.",
        },
        impact:
            "Cross-process safety without external dependencies like Redis.",
        category: "Infra",
        signals: [
            "Database-native locking avoids Redis dependency",
            "CHECK constraint enforces single-row lock semantics",
            "Staleness detection planned but not yet shipped",
        ],
        linkedDecisionId: "ADR-MG-04",
        riskLevel: "Medium",
        surfaceArea: "Core / Concurrency Control",
        evidence:
            "src/core/MigrationLock.ts.",
        notes:
            "Lock staleness detection planned but not fully implemented.",
    },
    {
        id: "EXP-26",
        title: "Dependency-Aware Topological Sort",
        project: "MigrateDB",
        decision: "shipped",
        hypothesis:
            "Explicit dependency metadata would outperform filename ordering for complex schema evolution.",
        variants: {
            control:
                "Pure lexicographic migration ordering.",
            variant:
                "Topological sorting with circular dependency detection based on SQL comment metadata.",
        },
        impact:
            "Reliable execution order for feature-branch migrations.",
        category: "Architecture",
        signals: [
            "SQL comment metadata drives dependency graph construction",
            "Circular dependency detection prevents deadlocked migrations",
            "require() loading as architectural compromise for import cycles",
        ],
        linkedDecisionId: "ADR-MG-05",
        riskLevel: "Low",
        surfaceArea: "Core / Migration Ordering",
        evidence:
            "src/core/DependencyResolver.ts.",
        notes:
            "Loaded via require() to avoid circular imports — architectural compromise.",
    },
    {
        id: "EXP-27",
        title: "Environment-Scoped Migration Filtering",
        project: "MigrateDB",
        decision: "shipped",
        hypothesis:
            "Environment metadata inside migration files would prevent accidental execution of dev-only scripts in production.",
        variants: {
            control:
                "All migrations executed regardless of environment.",
            variant:
                "EnvironmentFilter parsing '-- ENV:' metadata with config, CLI, and env var resolution.",
        },
        impact:
            "Safer production deployments with environment-aware schema control.",
        category: "Security",
        signals: [
            "SQL metadata annotations scope migrations to environments",
            "Multi-source resolution: config file, CLI, env var",
            "Prevents accidental dev-script execution in production",
        ],
        linkedDecisionId: "ADR-MG-06",
        riskLevel: "Medium",
        surfaceArea: "Core / Safety Controls",
        evidence:
            "src/core/EnvironmentFilter.ts.",
        notes:
            "Environment validation helper exists but not fully enforced by engine.",
    },
    {
        id: "EXP-28",
        title: "Hierarchical Config Loading",
        project: "MigrateDB",
        decision: "shipped",
        hypothesis:
            "Layered configuration precedence would improve team workflows and reduce CLI complexity.",
        variants: {
            control:
                "CLI-only configuration approach.",
            variant:
                "ConfigLoader supporting JSON/YAML with precedence: defaults < file < environment overrides < CLI.",
        },
        impact:
            "Reusable team configuration with minimal runtime overhead.",
        category: "Infra",
        signals: [
            "Four-layer config precedence: defaults → file → env → CLI",
            "YAML parsing as optional dependency for lightweight installs",
            "Team-shareable configuration reduces per-developer setup",
        ],
        riskLevel: "Low",
        surfaceArea: "CLI / Configuration",
        evidence:
            "src/utils/ConfigLoader.ts.",
        notes:
            "YAML parsing implemented as optional dependency to maintain lightweight installs.",
    },
    {
        id: "EXP-29",
        title: "Typed Error Hierarchy with Diagnostic Metadata",
        project: "MigrateDB",
        decision: "shipped",
        hypothesis:
            "Structured error classes would improve debugging and allow callers to react programmatically.",
        variants: {
            control:
                "Plain Error objects with string messages.",
            variant:
                "MigrateDBError base class with domain-specific subclasses including ChecksumError and LockError.",
        },
        impact:
            "Improved observability and error handling ergonomics.",
        category: "Architecture",
        signals: [
            "Domain-specific error subclasses enable programmatic handling",
            "Diagnostic metadata attached to error instances",
            "Prototype chain fixes for TypeScript class inheritance",
        ],
        riskLevel: "Low",
        surfaceArea: "Core / Error Handling",
        evidence:
            "src/utils/MigrateDBErrors.ts.",
        notes:
            "Prototype chain fixes applied for TypeScript compatibility.",
    },
    {
        id: "EXP-30",
        title: "Static SQL Validation Engine",
        project: "MigrateDB",
        decision: "shipped",
        hypothesis:
            "Pre-flight validation could prevent common migration mistakes before touching the database.",
        variants: {
            control:
                "Errors detected only during runtime execution.",
            variant:
                "Validator performing naming checks, SQL linting, dangerous-operation warnings, and file analysis.",
        },
        impact:
            "Reduced production risk through static analysis prior to execution.",
        category: "Security",
        signals: [
            "Pre-flight validation catches errors before DB contact",
            "Template literal detection prevents injection patterns",
            "Dangerous-operation warnings for destructive DDL",
        ],
        riskLevel: "Low",
        surfaceArea: "CLI / Static Analysis",
        evidence:
            "src/utils/Validator.ts.",
        notes:
            "Template literal detection prevents accidental injection patterns in SQL files.",
    },
    {
        id: "EXP-31",
        title: "Dual-Format Build (ESM + CJS)",
        project: "MigrateDB",
        decision: "shipped",
        hypothesis:
            "Publishing both ESM and CommonJS outputs would maximize compatibility across Node ecosystems.",
        variants: {
            control:
                "Single-module output with Unix-only build scripts.",
            variant:
                "Dual build pipeline with conditional exports and cross-platform tooling using rimraf.",
        },
        impact:
            "Library usable across modern and legacy Node environments.",
        category: "Infra",
        signals: [
            "Conditional exports for ESM/CJS consumer compatibility",
            "Cross-platform build tooling replaces Unix-only scripts",
            "Type definitions emitted from CJS build as primary target",
        ],
        riskLevel: "Low",
        surfaceArea: "Build / Distribution",
        evidence:
            "package.json exports configuration and build scripts.",
        notes:
            "Type definitions emitted from CJS build indicate primary runtime target.",
    },

    // SSE-Tester Experiments
    {
        id: "EXP-32",
        title: "Embedded Vite SSE Proxy vs Standalone Server",
        project: "SSE-Tester",
        decision: "iterated",
        hypothesis:
            "Embedding SSE proxy logic directly into the Vite dev server would reduce operational overhead compared to maintaining a separate Node.js proxy process.",
        variants: {
            control:
                "Standalone server.js proxy running on a separate port and requiring manual startup.",
            variant:
                "Custom Vite middleware plugin implementing SSE forwarding, auth header propagation, and protocol detection inside configureServer().",
        },
        impact:
            "Single-process development workflow with fallback support for non-Vite environments.",
        category: "Infra",
        signals: [
            "Vite middleware plugin eliminates separate proxy process",
            "Auth header propagation handled at proxy layer",
            "Both implementations coexist — gradual migration strategy",
        ],
        linkedDecisionId: "ADR-SSE-03",
        riskLevel: "Medium",
        surfaceArea: "Dev Tooling / Proxy Architecture",
        evidence:
            "vite.config.ts sseProxyPlugin and legacy server.js proxy implementation.",
        notes:
            "Both implementations coexist, suggesting a gradual migration rather than full replacement.",
    },
    {
        id: "EXP-33",
        title: "Recursive-Descent Query Parser for Event Filtering",
        project: "SSE-Tester",
        decision: "shipped",
        hypothesis:
            "A DSL-based query engine would provide more expressive filtering than basic text search for debugging live SSE streams.",
        variants: {
            control:
                "Simple includes()-based text search across event fields.",
            variant:
                "Custom recursive-descent parser supporting logical operators, comparisons, regex matching, and nested expressions compiled into predicate functions.",
        },
        impact:
            "SQL-like filtering capabilities for real-time event inspection.",
        category: "Architecture",
        signals: [
            "Custom DSL replaces basic text search for event filtering",
            "AST compilation memoized to avoid render-time recomputation",
            "Predicate functions compiled from parsed query expressions",
        ],
        linkedDecisionId: "ADR-SSE-02",
        riskLevel: "Low",
        surfaceArea: "Query Engine / Filtering",
        evidence:
            "src/utils/queryParser.ts and useQueryParser hook.",
        notes:
            "AST compilation memoized to avoid recomputation during renders.",
    },
    {
        id: "EXP-34",
        title: "Ring Buffer Event Storage Strategy",
        project: "SSE-Tester",
        decision: "shipped",
        hypothesis:
            "Capping stored events via a ring buffer would prevent memory growth during long-running streams.",
        variants: {
            control:
                "Unbounded event accumulation causing performance degradation.",
            variant:
                "Newest-first capped array with configurable MAX_EVENTS limit and slice-based trimming.",
        },
        impact:
            "Predictable memory usage regardless of stream duration.",
        category: "Performance",
        signals: [
            "Fixed-size buffer prevents unbounded memory growth",
            "Newest-first storage optimizes for recent-event access",
            "Configurable cap adapts to different debugging scenarios",
        ],
        linkedDecisionId: "ADR-SSE-04",
        riskLevel: "Low",
        surfaceArea: "Memory / Event Storage",
        evidence:
            "useEventStream.ts slice logic and MAX_EVENTS constant.",
        notes:
            "Newest-first storage optimizes for recent-event visibility but requires index mapping in timeline rendering.",
    },
    {
        id: "EXP-35",
        title: "Time-Travel Playback System",
        project: "SSE-Tester",
        decision: "experimental",
        hypothesis:
            "Playback controls would enable engineers to inspect historical event sequences rather than only viewing live streams.",
        variants: {
            control:
                "Pure live feed with no history navigation.",
            variant:
                "Playback hook tracking currentEventIndex with pause, seek, step, and go-live controls.",
        },
        impact:
            "Historical state inspection without interrupting background event ingestion.",
        category: "Architecture",
        signals: [
            "Decoupled playback from live ingestion state",
            "Seek and step controls for precise event inspection",
            "Auto-replay feature partially rolled out",
        ],
        linkedDecisionId: "ADR-SSE-07",
        riskLevel: "Medium",
        surfaceArea: "Playback / Event Navigation",
        evidence:
            "usePlayback.ts and PlaybackControls component.",
        notes:
            "Auto-replay feature exists but remains commented out, indicating partial rollout.",
    },
    {
        id: "EXP-36",
        title: "Canvas-Based Event Density Timeline",
        project: "SSE-Tester",
        decision: "shipped",
        hypothesis:
            "Canvas rendering would scale better than DOM lists for visualizing thousands of events.",
        variants: {
            control:
                "Scrollable list without temporal visualization.",
            variant:
                "Canvas minimap drawing color-coded event bars with click-to-seek functionality.",
        },
        impact:
            "High-performance visualization with minimal rendering overhead.",
        category: "Performance",
        signals: [
            "Canvas rendering bypasses DOM layout for high event density",
            "Color-coded event bars encode type information visually",
            "DevicePixelRatio scaling for retina display support",
        ],
        linkedDecisionId: "ADR-SSE-01",
        riskLevel: "Low",
        surfaceArea: "Visualization / Timeline",
        evidence:
            "src/components/EventTimeline.tsx canvas rendering logic.",
        notes:
            "DevicePixelRatio scaling used for retina displays.",
    },
    {
        id: "EXP-37",
        title: "Three-Layer Filter Composition Pipeline",
        project: "SSE-Tester",
        decision: "shipped",
        hypothesis:
            "Combining multiple independent filtering strategies would provide greater debugging flexibility than a single filter type.",
        variants: {
            control:
                "Single-stage filtering approach.",
            variant:
                "Pipeline combining DSL query parsing, text search, and field-level filters sequentially.",
        },
        impact:
            "Composable filtering enabling deep event inspection workflows.",
        category: "Architecture",
        signals: [
            "Sequential filter pipeline with independent stages",
            "Playback slicing occurs before filtering in data chain",
            "Five-stage transformation chain for event processing",
        ],
        riskLevel: "Low",
        surfaceArea: "Filtering / Data Pipeline",
        evidence:
            "src/App.tsx filteredEvents useMemo pipeline.",
        notes:
            "Playback slicing occurs before filtering, forming a five-stage data transformation chain.",
    },
    {
        id: "EXP-38",
        title: "Dual-Mode Field Filters (Value Toggle vs Regex)",
        project: "SSE-Tester",
        decision: "shipped",
        hypothesis:
            "Regex filtering would scale better for high-cardinality fields than checkbox selection alone.",
        variants: {
            control:
                "Set-based value filters using discovered unique field values.",
            variant:
                "Optional regex mode with dynamic UI switching and validation guards.",
        },
        impact:
            "Flexible filtering across both structured and pattern-based scenarios.",
        category: "Architecture",
        signals: [
            "Dual-mode filtering adapts to field cardinality",
            "Regex errors fail open to prevent UI blocking",
            "Dynamic UI switches between checkbox and regex input",
        ],
        riskLevel: "Low",
        surfaceArea: "Filtering / Field Analysis",
        evidence:
            "useCustomFilters.ts toggleRegexMode and regexPattern handling.",
        notes:
            "Regex errors fail open to prevent blocking UI interactions.",
    },
    {
        id: "EXP-39",
        title: "LocalStorage-Persisted Connection Profiles",
        project: "SSE-Tester",
        decision: "shipped",
        hypothesis:
            "Persisting endpoint configurations would reduce friction when switching between environments.",
        variants: {
            control:
                "Manual re-entry of URL and tokens on reload.",
            variant:
                "Profiles stored in localStorage with CRUD operations and tab-based switching UI.",
        },
        impact:
            "Faster reconnection workflows for multi-environment debugging.",
        category: "Infra",
        signals: [
            "Profile persistence eliminates manual re-entry friction",
            "CRUD operations for connection configuration management",
            "Tokens stored unencrypted — acceptable for dev tooling",
        ],
        riskLevel: "Low",
        surfaceArea: "UX / Connection Management",
        evidence:
            "useProfiles.ts localStorage synchronization logic.",
        notes:
            "Tokens stored unencrypted — acceptable tradeoff for developer tooling.",
    },
    {
        id: "EXP-40",
        title: "Auto-Reconnect Strategy with Linear Backoff",
        project: "SSE-Tester",
        decision: "shipped",
        hypothesis:
            "Automatic reconnection would maintain stream continuity during transient failures.",
        variants: {
            control:
                "Connection loss resulted in permanent disconnect.",
            variant:
                "Linear backoff reconnect attempts with capped retries and status feedback to UI.",
        },
        impact:
            "Self-healing connection lifecycle without manual intervention.",
        category: "Infra",
        signals: [
            "Self-healing connection prevents manual reconnection",
            "Capped retries prevent infinite reconnect loops",
            "Linear backoff — potential future optimization to exponential",
        ],
        riskLevel: "Low",
        surfaceArea: "Connection / Resilience",
        evidence:
            "useEventStream.ts reconnectAttemptRef and onerror handler.",
        notes:
            "Backoff strategy is linear rather than exponential — potential future optimization.",
    },

    // AgentBrake Experiments
    {
        id: "EXP-41",
        title: "Stdio Pipe Interception over HTTP Proxy",
        project: "AgentBrake",
        decision: "shipped",
        hypothesis:
            "Intercepting MCP tool calls via child-process stdio pipes is simpler and more portable than building an HTTP reverse proxy or SDK middleware wrapper.",
        variants: {
            control:
                "HTTP reverse proxy or MCP SDK middleware hook — standard approach for request interception in web services.",
            variant:
                "BrakeProxy spawns the target MCP server as a child process, pipes stdin through a JSON-RPC parser, evaluates policies per-message, and forwards or blocks before writing to the child's stdin. stdout passes through directly.",
        },
        impact:
            "Zero-dependency interception with no HTTP server or SDK hooks. Works with any MCP server speaking stdio JSON-RPC. Enables transparent CLI wrapping.",
        category: "Architecture",
        signals: [
            "Stdio pipe bypasses HTTP/SDK interception complexity",
            "JSON-RPC line-delimited parsing enables per-message policy evaluation",
            "Single-process design accepted as intentional constraint",
        ],
        riskLevel: "Medium",
        surfaceArea: "Proxy / Interception Layer",
        evidence:
            "src/proxy/interceptor.ts — BrakeProxy class: spawn() with stdio: ['pipe', 'pipe', 'inherit'], handleClientMessage() splits on newline and JSON.parse per line, interceptRequest() runs policy chain before forwarding.",
        notes:
            "Single-process limitation accepted intentionally. Designed as a CLI wrapper, not a long-running service.",
    },
    {
        id: "EXP-42",
        title: "Composable Policy Engine via Strategy Pattern",
        project: "AgentBrake",
        decision: "shipped",
        hypothesis:
            "Decomposing agent governance into independent, composable Policy objects is more maintainable than a monolithic validation function.",
        variants: {
            control:
                "Single validation function with switch/if branches handling all rules inline.",
            variant:
                "Policy interface with async validate(). Eight independent policies composed sequentially. First violation short-circuits execution.",
        },
        impact:
            "New policies added without touching proxy core. Policies independently testable. Ordering semantics introduced but documented.",
        category: "Architecture",
        signals: [
            "Strategy pattern decouples policy logic from proxy core",
            "Short-circuit evaluation on first violation",
            "Implicit opt-in — policies only instantiated if config present",
        ],
        riskLevel: "Low",
        surfaceArea: "Policy Engine / Composition",
        evidence:
            "src/policy/types.ts, src/policy/policies/*.ts, interceptor policy loop in src/proxy/interceptor.ts.",
        notes:
            "Implicit opt-in model — policies only instantiated if config is present.",
    },
    {
        id: "EXP-43",
        title: "Argument-Level Regex DLP instead of Tool-Name ACL",
        project: "AgentBrake",
        decision: "shipped",
        hypothesis:
            "Tool-name ACLs are insufficient; inspecting tool arguments with regex DLP rules provides real protection.",
        variants: {
            control:
                "AllowedToolsPolicy — binary allow/deny by tool name.",
            variant:
                "GranularAccessPolicy applies per-tool allow_if / deny_if regex rules on argument values.",
        },
        impact:
            "Blocks credential theft and sensitive file access even when tools are allowed. Demonstrated via adversarial demos.",
        category: "Security",
        signals: [
            "Argument-level inspection catches attacks tool-name ACLs miss",
            "Regex DLP rules configurable per-tool in YAML",
            "Adversarial demos validate policy effectiveness",
        ],
        riskLevel: "High",
        surfaceArea: "Security / Data Loss Prevention",
        evidence:
            "src/policy/policies/GranularAccessPolicy.ts, examples/enterprise-config.yml, examples/rogue-agent-attack.ts.",
        notes:
            "Regex compiled per call; acceptable overhead for current usage.",
    },
    {
        id: "EXP-44",
        title: "Five-Tier Violation Action Model",
        project: "AgentBrake",
        decision: "shipped",
        hypothesis:
            "Graduated responses provide more operational control than binary allow/deny.",
        variants: {
            control:
                "Binary allow/deny ACL model.",
            variant:
                "ViolationAction enum: warn, block, kill, sandbox, request_approval.",
        },
        impact:
            "Enables nuanced enforcement. kill terminates agent, warn logs only, block returns error. sandbox tracked but not enforced downstream.",
        category: "Architecture",
        signals: [
            "Five-tier graduated response replaces binary ACL",
            "kill action provides emergency agent termination",
            "sandbox action intentionally deferred pending trust propagation",
        ],
        riskLevel: "Medium",
        surfaceArea: "Policy Engine / Enforcement",
        evidence:
            "src/config/schema.ts, interceptor switch in src/proxy/interceptor.ts.",
        notes:
            "sandbox action intentionally non-functional pending trust propagation design.",
    },
    {
        id: "EXP-45",
        title: "Zod-Based Config Validation with Cascading Fallback",
        project: "AgentBrake",
        decision: "shipped",
        hypothesis:
            "Strict schema validation with safe defaults prevents misconfiguration failures.",
        variants: {
            control:
                "Manual JSON/YAML parsing with ad-hoc validation.",
            variant:
                "Zod schema with deep defaults. Loader tries multiple config paths and falls back to hardcoded safe config.",
        },
        impact:
            "Proxy never crashes on invalid config. Defaults enforce fail-closed sandbox behavior.",
        category: "Infra",
        signals: [
            "Zod schema enforces config correctness at parse time",
            "Cascading path fallback ensures config discovery",
            "Hardcoded fallback enforces fail-closed safety posture",
        ],
        riskLevel: "Low",
        surfaceArea: "Configuration / Validation",
        evidence:
            "src/config/schema.ts, src/config/loader.ts.",
        notes:
            "Hardcoded fallback bypasses Zod due to earlier parse instability — deliberate safety trade-off.",
    },
    {
        id: "EXP-46",
        title: "Budget Cost Tracking with Per-Tool Pricing",
        project: "AgentBrake",
        decision: "shipped",
        hypothesis:
            "Tracking per-tool cost prevents uncontrolled spend.",
        variants: {
            control:
                "No cost awareness.",
            variant:
                "BudgetPolicy tracks cumulative cost, warns at 80%, blocks at 100%.",
        },
        impact:
            "Operational spend control achieved. RuntimeMonitor also tracks cost but is unused.",
        category: "Infra",
        signals: [
            "Per-tool cost tracking prevents uncontrolled agent spend",
            "80% warning threshold enables proactive intervention",
            "Dual cost systems indicate future refactor needed",
        ],
        riskLevel: "Low",
        surfaceArea: "Cost Control / Budget Management",
        evidence:
            "src/policy/policies/BudgetPolicy.ts, examples/enterprise-config.yml.",
        notes:
            "Dual cost systems indicate refactor needed. RuntimeMonitor path is vestigial.",
    },
    {
        id: "EXP-47",
        title: "Adversarial Demo Harness for Policy Validation",
        project: "AgentBrake",
        decision: "shipped",
        hypothesis:
            "Security policies must be validated against realistic attack scenarios.",
        variants: {
            control:
                "Unit tests only.",
            variant:
                "Full-stack adversarial demos simulating credential theft, shell injection, SQL injection.",
        },
        impact:
            "Proved policy effectiveness end-to-end. Demos double as security showcases.",
        category: "Security",
        signals: [
            "Adversarial demos validate policies beyond unit test coverage",
            "Credential theft and injection scenarios prove defense depth",
            "Demo harness doubles as stakeholder security showcase",
        ],
        riskLevel: "Low",
        surfaceArea: "Security / Validation",
        evidence:
            "examples/rogue-agent-attack.ts, research-agent.ts, complete-demo.ts.",
        notes:
            "Multiple demo runners reflect iterative development; not consolidated.",
    },

    // Killed Experiments
    {
        id: "EXP-48",
        title: "Pure Client-Side OCR Pipeline",
        project: "CampusSync",
        decision: "killed",
        hypothesis:
            "Running OCR fully client-side with Tesseract.js would reduce server cost and provide instant feedback.",
        variants: {
            control:
                "Regex-only extraction after OCR text generation.",
            variant:
                "Heavy WASM-based Tesseract processing with preprocessing heuristics and layout-specific tuning.",
        },
        impact:
            "Accuracy plateaued around noisy certificates and performance degraded on low-end devices.",
        category: "Performance",
        signals: [
            "Client-side OCR failed on heterogeneous document layouts",
            "WASM processing cost exceeded server-side inference",
            "LLM-first extraction proved more reliable and scalable",
        ],
        riskLevel: "High",
        surfaceArea: "Document Processing / OCR Pipeline",
        reasonKilled:
            "LLM-first extraction with heuristic fallback proved more reliable and scalable.",
        lesson:
            "Edge compute is attractive but unreliable for heterogeneous document layouts.",
    },
    {
        id: "EXP-49",
        title: "Pure LLM Realtime Recommendation Engine",
        project: "Fuze",
        decision: "killed",
        hypothesis:
            "Using Gemini/LLM ranking directly on every recommendation request would maximize intelligence.",
        variants: {
            control:
                "Single semantic search pipeline.",
            variant:
                "LLM invoked synchronously in hot path for ranking and personalization.",
        },
        impact:
            "Latency exceeded acceptable thresholds and costs scaled linearly with usage.",
        category: "Performance",
        signals: [
            "Synchronous LLM ranking introduced unacceptable latency",
            "Cost scaled linearly with usage — no amortization possible",
            "Hybrid architecture achieved similar quality at fraction of cost",
        ],
        linkedDecisionId: "ADR-FZ-02",
        riskLevel: "High",
        surfaceArea: "ML / Recommendation Pipeline",
        reasonKilled:
            "Hybrid architecture with cached intent analysis + vector search achieved similar quality at a fraction of latency.",
        lesson:
            "LLMs work best as asynchronous advisors, not blocking execution engines.",
    },
    {
        id: "EXP-50",
        title: "Global Redis Dependency for Migration Locking",
        project: "MigrateDB",
        decision: "killed",
        hypothesis:
            "Using Redis-based distributed locks would simplify cross-process migration safety.",
        variants: {
            control:
                "No locking strategy in original podil implementation.",
            variant:
                "Prototype Redis lock implementation evaluated during adapter refactor.",
        },
        impact:
            "Introduced unnecessary infra dependency for a tool designed to be zero-runtime.",
        category: "Infra",
        signals: [
            "Redis dependency conflicts with zero-runtime design philosophy",
            "Advisory locking achieves same safety without external services",
            "Infrastructure tooling should minimize runtime dependencies",
        ],
        riskLevel: "Medium",
        surfaceArea: "Migration / Locking Strategy",
        reasonKilled:
            "Database-level advisory locking achieved the same safety without external services.",
        lesson:
            "Infrastructure tooling should minimize external runtime dependencies.",
    },
    {
        id: "EXP-51",
        title: "DOM-Based Event Timeline Rendering",
        project: "SSE-Tester",
        decision: "killed",
        hypothesis:
            "Virtualized DOM lists could scale to thousands of SSE events while maintaining React ergonomics.",
        variants: {
            control:
                "Simple event list rendering.",
            variant:
                "Prototype using virtualized components before canvas implementation.",
        },
        impact:
            "Frequent reflows and layout thrashing under high event rates.",
        category: "Performance",
        signals: [
            "DOM reconciliation overhead visible at high event rates",
            "Layout thrashing caused frame drops during rapid ingestion",
            "Canvas rendering eliminated reconciliation overhead entirely",
        ],
        linkedDecisionId: "ADR-SSE-01",
        riskLevel: "Medium",
        surfaceArea: "Visualization / Timeline",
        reasonKilled:
            "Canvas rendering provided deterministic performance and eliminated reconciliation overhead.",
        lesson:
            "For high-frequency visualizations, imperative rendering can outperform declarative UI.",
    },
    {
        id: "EXP-52",
        title: "Cloud-Synced Expense Storage",
        project: "SpentSmart",
        decision: "killed",
        hypothesis:
            "Syncing financial data to a backend would enable cross-device history and analytics.",
        variants: {
            control:
                "Local AsyncStorage persistence.",
            variant:
                "Early design explored Firebase/Supabase sync layer.",
        },
        impact:
            "Introduced privacy concerns and infrastructure complexity without clear user benefit.",
        category: "Security",
        signals: [
            "Cloud sync conflicts with zero-knowledge privacy philosophy",
            "Infrastructure complexity without clear user benefit",
            "Local-first architecture became core product differentiator",
        ],
        riskLevel: "High",
        surfaceArea: "Architecture / Privacy",
        reasonKilled:
            "Project philosophy shifted toward zero-knowledge local-first architecture.",
        lesson:
            "Not every feature adds value — alignment with product philosophy matters more than technical capability.",
    },
    {
        id: "EXP-53",
        title: "Circuit Breaker for Agent Tool Reliability",
        project: "AgentBrake",
        decision: "killed",
        hypothesis:
            "Applying circuit breaker semantics to tools would prevent runaway retry loops.",
        variants: {
            control:
                "No failure tracking — every tool call proceeds.",
            variant:
                "CircuitBreakerPolicy tracks failures per tool and blocks after threshold.",
        },
        impact:
            "Policy logic implemented but failure signals were never wired from interceptor or tools. Circuit never trips automatically.",
        category: "Architecture",
        signals: [
            "Failure attribution requires tool execution instrumentation",
            "Policy logic exists but lacks runtime signal wiring",
            "Retained as reference for future tool-runtime integration",
        ],
        riskLevel: "Medium",
        surfaceArea: "Reliability / Failure Isolation",
        evidence:
            "src/policy/policies/CircuitBreakerPolicy.ts.",
        reasonKilled:
            "Reliable failure attribution requires tool execution instrumentation that the stdio proxy doesn't provide.",
        lesson:
            "Policies that depend on runtime signals need instrumentation infrastructure before implementation.",
    },
    {
        id: "EXP-54",
        title: "Human-in-the-Loop Approval via JSON-RPC Error Codes",
        project: "AgentBrake",
        decision: "killed",
        hypothesis:
            "Approval workflows can be implemented entirely within JSON-RPC using custom error codes.",
        variants: {
            control:
                "External REST APIs or webhooks for approvals.",
            variant:
                "ApprovalPolicy returns JSON-RPC error -32001 to signal pending approval.",
        },
        impact:
            "Mechanism incomplete — no endpoint or CLI path calls approve()/deny(). Slack buttons point to non-existent handlers.",
        category: "Architecture",
        signals: [
            "Synchronous JSON-RPC hostile to human-latency workflows",
            "Approval state management requires separate control plane",
            "Protocol impedance mismatch identified as root blocker",
        ],
        riskLevel: "High",
        surfaceArea: "Governance / Approval Workflow",
        evidence:
            "src/policy/policies/ApprovalPolicy.ts, interceptor sendApprovalRequest().",
        reasonKilled:
            "Synchronous JSON-RPC is hostile to human-latency workflows. Requires separate control plane.",
        lesson:
            "Protocol constraints must be evaluated before building workflows that depend on out-of-band interaction.",
    },
    {
        id: "EXP-55",
        title: "Docker-Aware Path Resolution in Demo Runners",
        project: "AgentBrake",
        decision: "killed",
        hypothesis:
            "Runtime path detection can make demos portable across Docker and local environments.",
        variants: {
            control:
                "Hardcoded relative paths.",
            variant:
                "Environment detection with multi-path fallback logic.",
        },
        impact:
            "Worked but introduced fragility and maintenance overhead. Inconsistent across demos.",
        category: "Infra",
        signals: [
            "Runtime path detection introduced fragility over simplicity",
            "Inconsistent fallback logic across demo runners",
            "Root cause traced to tsconfig rootDir mirroring entire tree",
        ],
        riskLevel: "Low",
        surfaceArea: "Build / Dev Tooling",
        evidence:
            "examples/research-agent.ts path resolution logic.",
        reasonKilled:
            "Killed in favor of simplifying build layout. Root cause identified as tsconfig rootDir mirroring entire tree.",
        lesson:
            "Environment detection hacks often mask build configuration problems that should be fixed at the source.",
    },
];
