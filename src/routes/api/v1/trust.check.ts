import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { BOTCHAIN_MAINNET_CHAIN_ID, BOTCHAIN_TESTNET_CHAIN_ID } from "@/lib/chains";
import { runTrustCheck } from "@/lib/trust/service";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

const AddressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/, "Must be a 0x-prefixed 40-char hex address");

const BodySchema = z.object({
  chainId: z.number().int().default(177),
  action: z.enum(["swap", "approve", "transfer", "contract_call"]).default("contract_call"),
  contract: AddressSchema.optional(),
  wallet: AddressSchema.optional(),
  token: AddressSchema.optional(),
  txData: z.string().optional(),
  agentId: z.string().max(128).optional(),
  anchor: z.boolean().optional().default(false),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}

export const Route = createFileRoute("/api/v1/trust/check")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }
        const parsed = BodySchema.safeParse(raw);
        if (!parsed.success) {
          return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
        }
        try {
          const { anchor, ...trustInput } = parsed.data;
          const result = await runTrustCheck(trustInput, { anchor });
          return json(result);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return json({ error: msg }, 500);
        }
      },
      GET: async () =>
        json({
          endpoint: "POST /api/v1/trust/check",
          docs: "/docs",
          supportedChains: [
            { chainId: 177, name: "HashKey Chain" },
            { chainId: BOTCHAIN_MAINNET_CHAIN_ID, name: "BotChain", rpc: "https://rpc.botchain.ai" },
            { chainId: BOTCHAIN_TESTNET_CHAIN_ID, name: "BotChain Testnet", rpc: "https://rpc.bohr.life" },
          ],
          examples: {
            hsk: {
              chainId: 177,
              action: "swap",
              contract: "0xb9c5fcca50c2a8ed5aa9cc6fa030f0acdc7ded66",
              wallet: "0x0000000000000000000000000000000000000000",
            },
            botchain: {
              chainId: BOTCHAIN_MAINNET_CHAIN_ID,
              action: "swap",
              contract: "0x0000000000000000000000000000000000000001",
              agentId: "my-agent",
              anchor: true,
            },
            botchainTestnet: {
              chainId: BOTCHAIN_TESTNET_CHAIN_ID,
              action: "swap",
              contract: "0x0000000000000000000000000000000000000001",
              agentId: "my-agent",
              anchor: true,
            },
          },
        }),
    },
  },
});