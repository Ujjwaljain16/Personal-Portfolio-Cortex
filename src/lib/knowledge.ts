import { projects } from "@/data/projects";
import { decisions } from "@/data/decisions";
import { experiments } from "@/data/experiments";
import { deployments } from "@/data/deployments";


/**
 * Serializes all module data into a single context string for LLM consumption.
 * Small enough to fit in prompt context — no vector DB needed.
 */
export function serializeKnowledge(): string {
    const sections: string[] = [];

    // ─── Projects ──────────────────────────────────────
    sections.push("# ACTIVE PROJECTS\n");
    for (const p of projects) {
        sections.push(`## ${p.name} [${p.status}]`);
        sections.push(p.tagline);
        sections.push(`Tech: ${p.tech.join(", ")}`);
        sections.push(`Architecture: ${p.approach.join(" ")}`);
        sections.push("");
    }

    // ─── Decisions ─────────────────────────────────────
    sections.push("# ENGINEERING DECISIONS\n");
    for (const d of decisions) {
        sections.push(`## ADR-${d.number}: ${d.title} (${d.project})`);
        sections.push(`Problem: ${d.problem}`);
        sections.push(`Constraint: ${d.constraint}`);
        sections.push(`Decision: ${d.decision}`);
        sections.push(`Rejected: ${d.alternativeRejected}`);
        sections.push(`Outcome: ${d.outcome}`);
        sections.push(`Status: ${d.status} | Confidence: ${d.confidence}`);
        sections.push("");
    }

    // ─── Experiments ───────────────────────────────────
    sections.push("# EXPERIMENTS\n");
    for (const e of experiments) {
        sections.push(`## ${e.title} (${e.id}) [${e.project}]`);
        sections.push(`Hypothesis: ${e.hypothesis}`);
        sections.push(`Control: ${e.variants.control}`);
        sections.push(`Variant: ${e.variants.variant}`);
        sections.push(`Decision: ${e.decision} | Impact: ${e.impact}`);
        sections.push("");
    }

    // ─── Deployments ───────────────────────────────────
    sections.push("# DEPLOYMENTS\n");
    for (const d of deployments) {
        sections.push(`## ${d.repo} — ${d.commitMessage} (${d.commit})`);
        sections.push(`Category: ${d.category} | Runtime: ${d.runtime} | Host: ${d.host}${d.observed ? " | Observed: true" : ""}`);
        sections.push(`Impact: ${d.impact}${d.latencyChange ? ` | Measured: ${d.latencyChange}` : ""}`);
        sections.push(`Status: ${d.status} | Tags: ${d.tags.join(", ")}`);
        sections.push("");
    }



    return sections.join("\n");
}

export const CTO_SYSTEM_PROMPT = `You are simulating Ujjwal Jain's engineering thinking — a backend-focused engineer who builds production-grade systems.

You have access to his complete engineering record: projects, architectural decisions (ADRs), experiments, deployments,ies.

RULES:
1. Only answer using the provided engineering data. Never invent projects or decisions that aren't in the record.
2. If a question is outside the data, say "I don't have data on that in my engineering record" — don't hallucinate.
3. Be calm, structured, and tradeoff-aware. No generic advice.
4. When referencing decisions, use the format "ADR-{number}: {title}".
5. When referencing experiments, cite the metric and variants.
6. When referencing deployments, mention the commit and impact.
7. Keep responses concise — this is an engineering terminal, not a blog.

RESPONSE STRUCTURE (adapt as needed):
- Problem framing
- Approach used in past systems
- Tradeoffs considered
- Metrics/outcomes
- What would change for a new scenario

TONE: Think staff engineer in a system design review — precise, opinionated, evidence-backed.`;
