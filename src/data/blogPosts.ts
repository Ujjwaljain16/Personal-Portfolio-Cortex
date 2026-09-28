export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  excerpt: string;
  tags: string[];
  content: string; // Raw markdown-like content
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "agent-brake-architecture",
    title: "Deep Dive: Inside AgentBrake's Trusted \"Man-in-the-Middle\" Architecture",
    date: "Feb 10, 2026",
    readTime: "6 min read",
    excerpt: "A deep dive into the proxy architecture of AgentBrake, managing token consumption and enforcing policy constraints on autonomous agents.",
    tags: ["AI Safety", "Proxy Pattern", "TypeScript", "Architecture"],
    content: `
By **Ujjwal Jain**

In the rapidly evolving world of autonomous agents, "trust" is the most expensive currency. We give agents tools—file access, shell execution, API keys—and hope they behave. AgentBrake stops hoping and starts enforcing.

Today, we're taking a deep dive into AgentBrake's architecture. We'll look at how it physically intercepts control, how it manages "spending," and how it enforces the law—all without the agent even knowing it's being watched.

## 1. The Architecture: The "Bouncer" Proxy

At its core, AgentBrake is a transparent proxy. Think of it as a bouncer standing at the door of an exclusive club. The club is your operating system, and the agent is the guest trying to get in.

### The "Man-in-the-Middle" (stdio Interception)

Most security tools try to run inside the application (like a library). AgentBrake takes a "senior staff" approach: isolation.

Instead of being a library you import, AgentBrake wraps your agent process entirely.

- **Normal Flow**: IDE -> Agent Process
- **AgentBrake Flow**: IDE -> [AgentBrake Proxy -> Agent Process]

### How it works (The Code)

In \`src/proxy/interceptor.ts\`, AgentBrake spawns your agent as a child process. It then hijacks the communication lines: Standard Input (stdin) and Standard Output (stdout).

\`\`\`typescript
// Simplified Concept
this.child = spawn(targetCommand, targetArgs, { stdio: ["pipe", "pipe", "inherit"] });
process.stdin.on("data", (data) => {
    // 1. Intercept message from IDE/Client
    // 2. Check if it's a dangerous tool call
    // 3. If SAFE -> write to child.stdin
    // 4. If UNSAFE -> block and send error back to IDE
});
\`\`\`

Why this is brilliant:

- **Language Agnostic**: It doesn't care if your agent is written in Python, Node.js, or Go. It speaks pure JSON-RPC (MCP protocol).
- **Unbypassable**: The agent cannot "turn off" the proxy because the proxy owns the process.

## 2. Managing "Token" Consumption: The Arcade Model

You asked about "Token Consumption." Here is where AgentBrake makes a pragmatic, engineering trade-off.

In the LLM world, we usually count "tokens" (BPE tokens). However, counting tokens requires a tokenizer, which is heavy, slow, and model-specific.

### The "Heuristic" Budget (BudgetPolicy)

AgentBrake uses what I call the "Arcade Token" model. instead of counting literal letters/tokens, it assigns a monetary cost to actions.

In \`src/policy/policies/BudgetPolicy.ts\`, usage is tracked like this:

- **Fixed Cost**: Every tool call costs a default amount (e.g., $0.01).
- **Custom Cost**: specific tools (like deploy_production) can be "expensive" (e.g., $5.00).

\`\`\`typescript
// BudgetPolicy.ts Logic
const cost = this.toolCosts.get(toolName) || this.defaultCost;
const projectedSpend = this.currentSpend + cost;
if (projectedSpend > this.maxBudget) {
    return { action: "block", reason: "Budget exceeded." };
}
\`\`\`

The Senior Engineer Take: This is a smart V1 decision.

- **Pros**: extremely fast (no tokenization latency), simpler configuration for users ("You have $5 budget" is easier to understand than "You have 500k tokens").
- **Cons**: Less precise. A tool call with 100 lines of text costs the same as one with 1 line.

## 3. Enforcing the Law: The Policy Engine

AgentBrake doesn't just watch; it restricts. The enforcement happens in a synchronous loop inside \`interceptor.ts\`. Every single message passes through a gauntlet of policies.

### The "Metal Detector" (GranularAccessPolicy)

The most powerful policy is \`GranularAccessPolicy\`. It doesn't just check which tool is called; it checks the arguments.

It uses Regex patterns to inspect payload data. This is effectively Data Loss Prevention (DLP) for agents.

- **Scenario**: an agent tries to write a file.
- **The Rule**: \`allow_if: { arguments: { path: "^/tmp/.*" } }\`

The Check:

\`\`\`typescript
// GranularAccessPolicy.ts
if (!new RegExp(pattern).test(String(argValue))) {
   return { action: "block", reason: "Arguments do not match ALLOW pattern." };
}
\`\`\`

This allows you to say: "You can use write_file, but ONLY to the /tmp directory."

### The "Cool Down" (CircuitBreaker / RateLimit)

AgentBrake also protects against runaway agents—loops where an agent gets stuck retrying a failing tool 100 times/second.

- **RateLimit**: "Max 10 calls per minute."
- **CircuitBreaker**: "If you fail 5 times in a row, stop asking."

## Summary: A "Control Plane" for AI

AgentBrake is not an observability tool; it is a **control plane**.

1. It **sits outside**: Using a proxy architecture for maximum isolation.
2. It **simplifies costs**: Using a heuristic budget model for speed and usability.
3. It **inspects deep**: Using granular regex policies to validate not just what tool is used, but how it is used.
`
  },
  {
    slug: "integration-complexity",
    title: "The Idea Fit in 20 Lines. Making It Correct Took Over 200.",
    date: "Feb 19, 2026",
    readTime: "10 min read",
    excerpt: "What building a small utility taught me about the difference between algorithmic complexity and integration complexity and why the second one is harder.",
    tags: ["JavaScript", "Vitest", "Software Development", "Testing", "TypeScript"],
    content: `
*Update, Sep 2026: the \`mergeTests\` pull request described here (vitest-dev/vitest#9662) is still open. The maintainer has requested changes to the tests, so it is not merged.*

You’ve been there. 

You look at two things. They seem like they should work together. You write a small piece of glue code to connect them.

It almost works.

Values come back wrong. Things fail in ways that make no sense. It works in isolation, breaks together. No clear error. Just… wrongness.

You spend a day on it. Then another.

And somewhere in the middle of that second day, you realize: I don’t actually understand what these things are.

That’s the story I want to tell you.

### The Setup
I was working with a testing framework called Vitest. The specifics don’t matter what matters is the shape of the problem.

Vitest lets you create reusable test environments called fixtures. A fixture is a piece of setup-and-teardown logic that gets injected into your tests automatically. You tell the framework: “before this test runs, give me a database connection. After it finishes, close it.”

\`\`\`javascript
const dbTest = test.extend({
  db: async ({}, use) => {
    const db = await setupDatabase()
    await use(db)        // run the test with db available
    await db.close()     // clean up when done
  },
})
\`\`\`
Clean. Reusable. No repetition.

Now imagine you have two separate fixture sets one for a database, one for a web server. And you want a test that uses both. You want to write:

\`\`\`javascript
const myTest = mergeTests(dbTest, serverTest)

myTest('end-to-end test', ({ db, server }) => {
  // both available, both managed automatically
})
\`\`\`
Twenty lines, max. An afternoon of work.
This didn’t exist. I decided to build it.

The core idea fit in 20 lines.

Making it correct took over 200 spread across files, touching the framework’s core fixture engine, its type system, its override behavior, and its dependency resolution logic.

Here’s why.

### Two Kinds of Complexity
Before I get into what went wrong, I want to name something that took me a while to see clearly.

There are two fundamentally different kinds of complexity in software:

**Algorithmic complexity** is about the logic of what you’re computing. Sorting a million items. Parsing a deeply nested structure. Finding the shortest path in a graph. The hard part is the algorithm itself.

**Integration complexity** is about fitting your code into a system that already exists. The algorithm might be simple. The hard part is making it coexist with everything around it respecting invariants you didn’t design, hooking into lifecycles you didn’t build, preserving behaviors you didn’t invent.

My \`mergeTests()\` had near-zero algorithmic complexity. It had enormous integration complexity.

And I didn’t understand that distinction when I started. I thought I was solving an algorithmic problem. I was actually solving an integration problem. That mismatch between what I thought I was doing and what I was actually doing is the entire reason this took as long as it did.

### What I Thought I Was Building
My first mental model: fixtures are objects. Merge them like objects.

\`\`\`javascript
// naive version - extract properties from b, add them to a
function mergeTests(a, b) {
  const fixtures = extractFixtures(b)
  return a.extend(fixtures)
}
\`\`\`
Property extraction. Object composition. Ten lines. Done by lunch.

I ran it.

Some tests passed. Some returned undefined. One returned NaN. Tests that worked perfectly in isolation started failing when run together. No clear error. No stack trace pointing at my code.

I added console.log statements everywhere. I read my code four times. It looked correct.

It was not correct.

The problem wasn’t in my logic. The problem was in my mental model.

### What a Fixture Actually Is
Here’s what I thought a fixture was:

\`\`\`javascript
// a name mapped to a setup function right?
{
  db: async () => { ... },
  server: async () => { ... }
}
\`\`\`
A static map. A dictionary of functions.

Here’s what a fixture actually is:

\`\`\`
TestFixtures
   ├── parent              → pointer to the previous layer in the chain
   ├── override layers     → per-suite customizations stored in WeakMaps
   ├── registrations       → the actual fixture definitions
   ├── scope rules         → is this fixture global, suite-level, or test-level?
   ├── dependency graph    → which fixtures need which other fixtures first
   └── cleanup lifecycle   → teardown order, async cleanup queues
\`\`\`

This isn’t a dictionary. This is a layered resolution engine.

Resolution walks upward through the parent pointers. Merging must preserve this exact structure; naive concatenation corrupts it.

Every time you call \`test.extend()\`, you're not adding to a flat object. You're creating a new layer that sits on top of the previous one, pointing back to it. When a fixture is needed, the engine walks up this chain until it finds the right definition at the right scope. When a test finishes, cleanup runs in reverse order down the chain.

The whole system depends on this parent chain being intact. Every other piece—override behavior, scope resolution, dependency validation, cleanup ordering—assumes the chain is correctly structured.

My code was corrupting the chain.

Not intentionally. I didn’t even know the chain existed.

But “I didn’t know” and “it doesn’t matter” are not the same thing.

### The Stack Overflow That Made It Undeniable
Here’s the moment I couldn’t rationalize away anymore.

I had two fixture sets with an implicit relationship between them. Fixture x depended on fixture y. Fixture y depended on fixture x. Circular dependency.

Vitest already handles this: it detects cycles in the dependency graph and throws a clear, helpful error before anything bad happens.

But when I ran my naive merge on these two sets?

\`RangeError: Maximum call stack size exceeded\`

A stack overflow. Not a helpful error. An infinite loop.

Vitest’s cycle detection never fired because my merge had scrambled the structure it uses to detect cycles. The engine tried to resolve x, which needed y, which needed x, which needed y... forever.

I didn’t introduce a circular dependency. I hid one from the guard that was supposed to catch it.

That’s the moment I stopped trying to fix my code and started actually reading the framework’s code.

### Reading Code You Didn’t Write
Here’s advice I wish someone had given me earlier:

When something breaks mysteriously, stop writing code. Read the source.
Not the docs—the implementation.
That’s where the real contracts live.
That’s where you see the assumptions no one wrote down.

### The Fix Was Embarrassingly Small
Once I understood this, the fix became obvious: don’t touch the chain. Use the operations the framework already provides for composing layers.

\`\`\`javascript
function mergeTests(...tests) {
  let [current, ...rest] = tests

  for (const next of rest) {
    const fixtures = extractUserFixtures(next)
    current = current.extend(fixtures)  // let the engine do the chaining
  }

  return current
}
\`\`\`
The runtime core: about 12 lines. Correct.

### The 200 Lines You Don’t See
Here’s what the final pull request actually touched. This is the integration complexity part—the part that doesn’t show up in clever abstractions but shows up in real systems.

1. **Hierarchical override traversal.** When you customize a fixture’s behavior for a specific test suite, that customization is stored in a WeakMap tied to the suite. Merging fixture sets means ensuring those WeakMaps are traversed correctly.
2. **Parent chain reconstruction.** The merge operation needed to create a new chain that incorporated both parents in a way that preserved the resolution order.
3. **Context isolation.** Ensuring contexts didn’t leak between suites—a subtle bug where one test’s setup bleeds into another test’s state.
4. **Dependency graph validation.** Cross-layer cycles where fixture A in one set depends on fixture B in another required extending the validation.
5. **Override semantics.** Making \`mergeTests()\` behave exactly like calling \`.extend()\` multiple times.
6. **Cleanup lifecycle ordering.** Ensuring teardown order is deterministic and correct across both sets.
7. **Static API compatibility.** Preserving semi-documented properties and methods on the \`TestAPI\` object.
8. **Type inference across variadic generics.** Generic intersection types that work for any number of arguments without widening to \`any\`.

\`\`\`typescript
// The type signature doing more work than the runtime code
function mergeTests<A, B>(a: TestAPI<A>, b: TestAPI<B>): TestAPI<A & B>
// Variadic version for three or more
function mergeTests<T extends TestAPI<any>[]>(...tests: T): TestAPI<UnionToIntersection<...>>
\`\`\`

9. **Regression tests.** Verifying everything still worked—not just the new behavior, but the existing behavior.

None of this is algorithmically complex. All of it is integration work.

### Why Integration Complexity Is Actually Harder
Algorithmic complexity has a finish line. You can prove an algorithm is correct. You can measure its performance. You can test it in isolation.

Integration complexity doesn’t work that way.

When you’re working inside a system you didn’t design, the rules are partially visible and partially assumed. The invariants aren’t written down. You discover them by breaking them.

I can prove a sort algorithm works. I cannot easily prove that my fixture merge doesn’t violate some constraint in Vitest’s engine that I haven’t discovered yet.

That uncertainty is the hard part. Not the code—the confidence in the code.

Getting that confidence requires:
- Reading the source until you understand the model, not just the API.
- Breaking things intentionally to discover invariants.
- Testing not just what you built but everything adjacent to it.
- Being honest with yourself about what you don’t know.

### A Design Question Nobody Thinks About
Once the core worked, I hit a subtle question: Say someone had customized one of the fixture sets. When you merge two sets together, what happens to those customizations?

The decision: the merge helper behaves exactly like calling the framework’s own composition method multiple times. No new rules. No special cases. Completely predictable.

This is a principle worth internalizing: **predictability beats cleverness.**

### Every System Has a Model. Your Job Is to Find It.
Not the model in the docs. The real model—the one the code actually lives by. Once you have the model, three things become clear:
1. **Why it breaks** — because you can see which invariant you violated.
2. **How to fix it** — because you know which rule to respect.
3. **How to extend it** — because you know where the seams are.

Good engineering isn’t about how much you can change. It’s about how little you need to.
`
  },
  {
    slug: "unicode-corruption-base64",
    title: "When 👍 Turned Into ð: A Deep Dive Into Base64, Unicode, and a Silent JavaScript Bug",
    date: "Feb 15, 2026",
    readTime: "4 min read",
    excerpt: "Recently, I ran into a strange bug where emojis like 👍 were showing up as corrupted characters in stack traces. This is a deep dive into how JavaScript's atob() handles Base64, Unicode, and the difference between binary strings and text.",
    tags: ["JavaScript", "Unicode", "Debugging", "Web Development", "Programming"],
    content: `
Recently, I ran into a strange bug. A file named:

\`repro-👍.test.ts\`

Was showing up in stack traces as:

\`repro-ð.test.ts\`

No crash. No exception. No encoding error. Just… wrong characters.

At first glance, it looked harmless. But the more I investigated, the more I realized this was a deeper issue about how JavaScript handles Base64 and Unicode.

This is the story of what actually happened and what I learned.

### The First Clue: The Bytes Were Correct
When debugging encoding issues, you never trust what you see. You inspect the bytes.

So I logged the filename at the byte level:

\`\`\`javascript
[...filename].map(c => c.codePointAt(0).toString(16))
\`\`\`

And I got:
\`[ '72', '65', '70', '72', '6f', '2d', 'f0', '9f', '91', '8d', '2e', '74', '73' ]\`

Let’s break that down:
- **72 65 70 72 6f 2d** → \`repro-\`
- **f0 9f 91 8d** → 👍 (UTF-8 bytes)
- **2e 74 73** → \`.ts\`

The bytes were perfectly correct. So why was I seeing \`ð\` instead of \`👍\`?

### The Real Problem: Base64 Returns Bytes, Not Text
The filename came from a Base64-encoded source map. It was decoded using:

\`atob(base64String)\`

Here’s the key detail most developers don’t think about: **\`atob()\` does NOT return UTF-8 text. It returns a binary string.**

That means:
- Each character represents a raw byte (0–255).
- JavaScript stores those bytes inside a normal string.
- But it does NOT decode them as UTF-8.

### What Actually Happened to 👍
The emoji 👍 in UTF-8 is represented by four bytes: \`F0 9F 91 8D\`.

After calling \`atob\`, JavaScript returned a string containing characters whose code units were: \`0xF0, 0x9F, 0x91, 0x8D\`.

But JavaScript strings are UTF-16. So those bytes were interpreted as individual characters, not as a combined UTF-8 sequence. The first byte \`0xF0\` became \`ð\`, and the rest became strange control-like characters.

So: **👍** turned into **ð\\x9F\\x91\\x8D**.

The bytes were correct. The interpretation was wrong.

### Binary Strings vs Real Text
This was the real learning moment. There are two very different things:

1.  **A Binary String**: A string where each character represents a raw byte. It’s not meant to be readable; it’s just a container for data. That’s what \`atob()\` gives you.
2.  **A Proper UTF-8 Text String**: A string where multiple bytes combine into one character. \`👍\` is treated as a single symbol. To get this, you must explicitly decode the bytes.

### The Correct Way to Decode Base64
If you decode Base64 like this: \`atob(base64)\`, you are getting raw bytes inside a string. You must then convert those bytes into UTF-8 text properly.

**In a Node-like environment:**
\`\`\`javascript
Buffer.from(base64, 'base64').toString('utf-8')
\`\`\`

**In a browser:**
\`\`\`javascript
const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
const text = new TextDecoder().decode(bytes)
\`\`\`

That second step, \`TextDecoder\`, is the missing piece. It tells JavaScript: “These bytes are UTF-8. Decode them correctly.”

### Why This Bug Was Confusing
Here’s where it got interesting. Sometimes the stack trace looked correct. Sometimes it looked corrupted. Why?

Because later in the system, some path resolution logic would overwrite the corrupted relative filename with a clean absolute one.

That masking effect made the bug very hard to spot. Only when relative paths were preserved did the corruption become visible.

### The Bigger Lesson
This bug wasn’t about emojis. It was about data interpretation. Base64 decoding gives you bytes. Bytes are not text. You must explicitly tell JavaScript how to interpret those bytes.

If you skip that step, ASCII and simple text might work, but emojis and multibyte characters will break. Silent corruption happens, and silent corruption is worse than crashes.

### What This Debugging Journey Taught Me
1.  **Encoding bugs are interpretation bugs**: Most of the time, the bytes are correct. The problem is how we read them.
2.  **\`atob\` is not a UTF-8 decoder**: It gives you raw bytes. Nothing more.
3.  **Hex inspection is powerful**: If the bytes are correct but the string looks wrong, you have a decoding issue.
4.  **Modern JavaScript still has sharp edges**: UNDERNEATH all our high-level abstractions, UTF-8, UTF-16, and binary data rules still matter.

Sometimes debugging isn’t about fixing code. It’s about understanding the invisible layers beneath it.
`
  }
];
