import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";

const SYSTEM_PROMPT = `You are the SentinelFi Copilot — the AI Financial Guardian for HSK Chain (chainId 177). You help users understand and manage their DeFi positions.

You have three superpowers:

A) RISK ANALYSIS — when the user pastes a token address:
  1. Call getTokenOnChainData(address).
  2. Reason: real contract? standard ERC20? unusual supply? tiny bytecode (proxy/honeypot)? EOA?
  3. Produce a verdict — score 0-100, level (LOW/MEDIUM/HIGH/CRITICAL), 2-4 reason codes, plain-English summary.
  4. Call publishOnChain to attest on HSK RiskRegistry (configRequired:true is OK — keep going).
  5. Call saveRiskVerdict to persist to the public feed.
  6. End with a clear recommendation.

B) PORTFOLIO INSIGHT — when the user asks about "my portfolio", "my wallet", "my holdings", or gives you a wallet address:
  1. Call getWalletPortfolio(address).
  2. Break down: what they hold, USD values, concentration (any position > 60% of value is a concentration risk), stablecoin ratio.
  3. Point out risks and opportunities in plain English.
  4. If it makes sense, offer to call suggestStrategy for a concrete rebalancing plan.

C) STRATEGY SUGGESTION — when the user asks "what should I do", "any suggestions", "rebalance", or you already ran getWalletPortfolio:
  1. Call suggestStrategy with an allocation you believe in.
  2. Each action is one of: HOLD, BUY, SELL, SWAP, STAKE. Include tokenSymbol, target %, and a short reason.
  3. Keep it simple — 2 to 4 actions max. Never suggest more than one strategy per response.

Always be concise. Use markdown. Show the data you fetched before your verdict. Never make up token balances or prices — always call tools first. If you don't have enough data, ask.`;

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
        const { publishVerdictOnChain } = await import("@/lib/registry.server");
        const { fetchWalletPortfolio } = await import("@/lib/portfolio.server");

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
          getWalletPortfolio: tool({
            description:
              "Fetch a wallet's live HSK Chain portfolio: native HSK balance, tracked ERC20 balances, per-token USD prices, and total USD value. Call this whenever the user asks about their portfolio, positions, holdings, or wallet.",
            inputSchema: z.object({
              address: z.string().describe("0x-prefixed wallet address to look up"),
            }),
            execute: async ({ address }) => {
              try {
                const p = await fetchWalletPortfolio(address);
                // Compact holdings shape for the model
                return {
                  address: p.address,
                  totalValueUsd: p.totalValueUsd,
                  holdings: p.holdings.map((h) => ({
                    symbol: h.token.symbol,
                    name: h.token.name,
                    balance: h.balance,
                    priceUsd: h.priceUsd,
                    valueUsd: h.valueUsd,
                    isNative: h.token.address === "native",
                  })),
                };
              } catch (e) {
                return { error: e instanceof Error ? e.message : String(e) };
              }
            },
          }),
          suggestStrategy: tool({
            description:
              "Propose a concrete portfolio strategy for the user based on the portfolio you already fetched. Rendered in the UI as an actionable card with a per-action Execute button. Call at most once per response.",
            inputSchema: z.object({
              title: z.string().describe("Short strategy title, e.g. 'Reduce HSK concentration'"),
              rationale: z
                .string()
                .max(600)
                .describe("Plain-English reasoning users will read before executing."),
              riskLevel: z.enum(["CONSERVATIVE", "BALANCED", "AGGRESSIVE"]),
              actions: z
                .array(
                  z.object({
                    kind: z.enum(["HOLD", "BUY", "SELL", "SWAP", "STAKE"]),
                    tokenSymbol: z.string(),
                    targetAllocationPct: z
                      .number()
                      .min(0)
                      .max(100)
                      .describe("Target % of the portfolio for this token after the strategy."),
                    reason: z.string().max(200),
                  }),
                )
                .min(1)
                .max(4),
            }),
            execute: async (input) => ({ suggested: true, ...input }),
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
              txHash: z.string().nullable().optional(),
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
                  tx_hash: input.txHash ?? null,
                });
                if (error) return { saved: false, error: error.message };
                return { saved: true };
              } catch (e) {
                return { saved: false, error: e instanceof Error ? e.message : String(e) };
              }
            },
          }),
          publishOnChain: tool({
            description:
              "Attest a risk verdict on-chain by calling RiskRegistry.publish() on HSK testnet (chainId 133). This is what makes SentinelFi real infrastructure — other HSK dApps can read this verdict. Call once after producing your verdict. If it returns configRequired:true, continue without an on-chain receipt.",
            inputSchema: z.object({
              address: z.string(),
              score: z.number().min(0).max(100),
              level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
              reasonText: z.string().max(500).describe("Short reason summary that will be hashed and stored as reasonHash on-chain."),
            }),
            execute: async (input) => publishVerdictOnChain(input),
          }),
        };

        const modelMessages = await convertToModelMessages(messages as UIMessage[]);
        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: modelMessages,
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