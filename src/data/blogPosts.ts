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
        slug: "restful-mcp-mental-model",
        title: "A RESTful HTTP Mental Model to Understand MCP",
        date: "Feb 10, 2026",
        readTime: "4 min read",
        excerpt: "Exploring the Model Context Protocol (MCP) by drawing parallels to RESTful HTTP architecture, making it easier for web developers to grasp the concepts.",
        tags: ["MCP", "Architecture", "REST", "Mental Models"],
        content: `
The Model Context Protocol (MCP) is a specification designed to facilitate interaction between AI models, tools, and resources. I was wondering about an experiment where we could try to describe MCP in a way that is similar to the RESTful HTTP architecture to make MCP more understandable for those coming from web development.

## A Reference MCP Server

To put our methodology and HTTP’s RESTful mental model into play we’ll imagine a real-world use-case of an MCP Server.

Our reference MCP Server will be a “Travel Planner” that helps users plan trips by providing information about destinations, accommodations, and activities. The MCP Server will allow booking flights or hotels and cancelling reservations.

Here is a quick high-level code implementation in JavaScript of the MCP Server using Anthropic’s official @modelcontextprotocol/sdk package:

\`\`\`javascript
import { MCPServer } from '@modelcontextprotocol/sdk';

// Tool for searching flights
const searchFlightsTool = {
  name: 'searchFlights',
  description: 'Search for available flights based on destination and dates.',
  parameters: {
    destination: { type: 'string', description: 'Destination city or airport code' },
    departureDate: { type: 'string', description: 'Departure date in YYYY-MM-DD format' },
    returnDate: { type: 'string', description: 'Return date in YYYY-MM-DD format' },
  },
  execute: async (params) => {
    // Mock implementation of flight search
    return [
      { flightNumber: 'FL123', airline: 'AirExample', price: 300 },
      { flightNumber: 'FL456', airline: 'FlySample', price: 350 },
    ];
  },
};

// Tool for cancelling bookings
const cancelBookingTool = {
  name: 'cancelBooking',
  description: 'Cancel an existing booking using the booking ID.',
  parameters: {
    bookingId: { type: 'string', description: 'The ID of the booking to cancel' },
  },
  execute: async (params) => {
    // Mock implementation of booking cancellation
    return { success: true, message: \`Booking \${params.bookingId} has been cancelled.\` };
  },
};
\`\`\`

## Understanding MCP through RESTful HTTP

To better understand MCP, we can draw parallels to the well-known RESTful HTTP architecture, which is widely used in web development.

Quick reminder on the building blocks of RESTful HTTP:

- **HTTP Methods** drive actions (GET, POST, PUT, DELETE)
- **Resources** are the entities being acted upon (e.g., users, posts)
- **Status Codes** indicate the result of the action (e.g., 200 OK, 404 Not Found)
- **Endpoints** are the URLs where resources can be accessed (e.g., /api/users)

If we map the above RESTful concepts to MCP, we can see the following correspondences:

- **HTTP Methods** -map-to-> **Tools** (e.g., searchFlights, cancelBooking): meaning, what would be a DELETE HTTP method in RESTful would be a cancelBooking tool in MCP. A GET HTTP method would be a searchFlights tool in MCP.
- **Resources** -map-to-> **Business resources** in an MCP Server (e.g., ‘flights’, ‘bookings’).
- **Status Codes** -map-to-> **Tool Responses** (e.g., success, or ‘not found’ responses).
- **Endpoints** -map-to-> **MCP Server Resources** (e.g., \`flights://deals’, ‘bookings://{id}’).

As you can see, some of the concepts translate quite well between RESTful HTTP and MCP, with a strong correlation like Endpoints and MCP Server Resources, others, not so much.

Of course, keeping in mind that the underlying Model Context Protocol specification relies on a JSON-RPC 2.0 transport layer, which is maybe more akin to GraphQL than RESTful HTTP.

## Applying MVC (Model-View-Controller Paradigm) to MCP

What if we also try to apply the MVC (Model-View-Controller) paradigm to MCP? How would that look?

An break-down of MVC architecture consists of:

- **Model**: Manages the data and business logic.
- **View**: Handles the display and user interface.
- **Controller**: Manages user input and interactions.

This is a classic software design pattern used for developing user interfaces that divides the related program logic into three interconnected elements and has dominated early-age web development until it was superseded by other paradigms like MVVM (known mostly for Single Page Applications (SPA) frameworks like Angular, React, Vue, etc.).

So if we try to map the MVC components to MCP, we could see something like this:

- **M** - Services
- **V** - Tool Response
- **C** - Tools

\`\`\`
    Model                 View                  Controller
      |                     |                      |
Business Logic        Tool Response        Tools or Resources  
\`\`\`

With MCP-UI emerging in recent months, potentially the View component could be represented by the MCP-UI, which provides a user interface for interacting with the MCP Server. Would it make a better fit? Time will tell.

MVC likely makes a better paradigm for capturing a mental model of how MCP Servers are architected, however, I’ve only just scratched the surface here with just tools and resources, where-as MCP Servers have other capabilities like Prompts. Moreso, there’s also another player in the mix which is the MCP Client and capabilities more directly related to it like Elicitations and Sampling.

## Conclusion

I find it an interesting exercise to explore the analogy of MCP with other prior technical concepts like REST and MVC and even when those don’t map perfectly, there’s hopefully a nugget to be found in the exercise and learn something new.

Keep on MCPing.`
    },
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
    }
];
