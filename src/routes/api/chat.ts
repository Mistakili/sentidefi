import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";

const SYSTEM_PROMPT = `You are SentinelFi Copilot — an on-chain risk analyst for HSK Chain (HashKey Chain, chainId 177).

When a user pastes a token address, you MUST:
1. Call the getTokenOnChainData tool with that address to fetch live on-chain data.
2. Reason about the data — is it a real contract? Does it expose standard ERC20 metadata? Is total supply unusual? Is the bytecode unusually small (possible proxy/honeypot)? Is it an EOA (not a contract)?
3. Produce a risk verdict with: a numeric score 0-100 (0 = safe, 100 = critical scam), a level (LOW | MEDIUM | HIGH | CRITICAL), 2–4 short reason codes (e.g. "UNVERIFIED_METADATA", "TINY_BYTECODE", "EOA_NOT_CONTRACT", "NORMAL_ERC20"), and a 1-paragraph plain-English explanation.
4. Call saveRiskVerdict to persist the verdict to the public scan feed.
5. End with a clear recommendation (Safe to interact / Proceed with caution / Avoid).

Always be concise. Use markdown. Show the data you found before the verdict. If the address is invalid, explain that without calling tools.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
        const { getTokenOnChainData } = await import("@/lib/hsk-rpc.server");

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const tools = {
          getTokenOnChainData: tool({
            description:
              "Fetch live on-chain data for an HSK Chain address: contract bytecode size, ERC20 metadata (name, symbol, decimals, totalSupply), and whether it is a contract or EOA. Call this first whenever the user asks about a token.",
            inputSchema: z.object({
              address: z.string().describe("0x-prefixed 40-char hex token address"),
            }),
            execute: async ({ address }) => {
              try {
                return await getTokenOnChainData(address);
              } catch (e) {
                return { error: e instanceof Error ? e.message : String(e) };
              }
            },
          }),
          saveRiskVerdict: tool({
            description:
              "Persist a finalized risk verdict to the public SentinelFi scan feed. Call this exactly once after producing your verdict.",
            inputSchema: z.object({
              address: z.string(),
              score: z.number().min(0).max(100),
              level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
              summary: z.string().max(500),
              reasonCodes: z.array(z.string()).max(6),
              tokenName: z.string().nullable().optional(),
              tokenSymbol: z.string().nullable().optional(),
            }),
            execute: async (input) => {
              try {
                const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
                const { error } = await supabaseAdmin.from("risk_scans").insert({
                  address: input.address.toLowerCase(),
                  chain_id: 177,
                  score: input.score,
                  level: input.level,
                  summary: input.summary,
                  reason_codes: input.reasonCodes,
                  token_name: input.tokenName ?? null,
                  token_symbol: input.tokenSymbol ?? null,
                });
                if (error) return { saved: false, error: error.message };
                return { saved: true };
              } catch (e) {
                return { saved: false, error: e instanceof Error ? e.message : String(e) };
              }
            },
          }),
        };

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages as UIMessage[]),
          tools,
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});