/**
 * Personal context for /ask, beyond the engineering record: how I think, what I care about,
 * what I'm like to work with. Pull real material from wherever you already have it written
 * down about yourself (ChatGPT's Settings -> Personalization -> Memory is one source) and
 * curate a short list from it — don't paste the export wholesale.
 *
 * PUBLIC AND UNVERIFIED. Unlike every other file in src/data, nothing here is checked against
 * a repository; it is self-reported, and the assistant is told to present it that way. It is
 * also servable to any visitor who asks a suitable question, and it sits in git history
 * permanently once committed. Before adding a fact, ask:
 *   - Would I be fine with a recruiter, or a stranger, reading this?
 *   - Does it name or describe another person? If so, leave it out.
 *   - Is it health, financial, immigration, relationship or family information? Leave it out.
 *   - Is it a private opinion about a specific employer, colleague or company? Leave it out.
 * When in doubt, leave it out — this list can always grow later.
 */

export interface AboutFact {
    /** A short grouping shown to the model, e.g. "Working style", "What I care about". */
    category: string;
    text: string;
}

// Empty on purpose until there are real, curated facts. Add them as { category, text }, one or two
// plain sentences each, in the same unhyped voice as the rest of the site. An empty list means
// /ask simply has no personal-context section.
export const aboutMe: AboutFact[] = [];
