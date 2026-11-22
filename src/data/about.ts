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

// Only things in my own words: the first two are the home page's introduction, which I wrote; the last is
// my current focus as I stated it. Add more as { category, text }, one or two plain sentences each.
export const aboutMe: AboutFact[] = [
    {
        category: "In my own words",
        text: "I like understanding how things work beneath the surface, and building them myself.",
    },
    {
        category: "How I explore ideas",
        text: "I'm a computer science student. I learn by building things end to end, measuring how they behave, and writing down what broke and what isn't done yet.",
    },
    {
        category: "Current focus",
        text: "Learning system design and data structures and algorithms.",
    },
];
