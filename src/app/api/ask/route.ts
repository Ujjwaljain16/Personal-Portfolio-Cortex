import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { serializeKnowledge, CTO_SYSTEM_PROMPT } from "@/lib/knowledge";

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const knowledge = serializeKnowledge();

    const result = streamText({
        model: google("gemini-2.5-flash"),
        system: `${CTO_SYSTEM_PROMPT}\n\n---\n\nENGINEERING RECORD:\n\n${knowledge}`,
        messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
}
