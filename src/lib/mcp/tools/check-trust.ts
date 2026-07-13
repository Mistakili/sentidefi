import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "check_trust",
  title: "Check trust (Trust API)",
  description:
    "The single question every AI agent, wallet, or protocol should ask before executing an on-chain action on a supported EVM chain: is this action safe? Returns a structured verdict (ALLOW / WARN / BLOCK) with risk score, severity, on-chain checks, plain-English reasoning, and a cryptographically signed Trust Receipt that can be verified off-chain by anyone with the attestor's public address. HSK Chain live today; BotChain and additional EVMs plug into the same interface.",
  inputSchema: {
    chainId: z.number().int().describe("EVM chain id (177 = HSK Chain)."),
    action: z
      .enum(["swap", "approve", "transfer", "contract_call"])
      .describe("The kind of on-chain action being evaluated."),
    contract: z
      .string()
      .regex(/^0x[0-9a-fA-F]{40}$/)
      .optional()
      .describe("Target contract address (token, protocol, or destination)."),
    wallet: z
      .string()
      .regex(/^0x[0-9a-fA-F]{40}$/)
      .optional()
      .describe("Wallet initiating the action (optional, used for context)."),
    token: z
      .string()
      .regex(/^0x[0-9a-fA-F]{40}$/)
      .optional()
      .describe("Token address if different from `contract`."),
    agentId: z
      .string()
      .max(128)
      .optional()
      .describe("Stable identifier of the calling agent (for future reputation)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
  handler: async (input) => {
    const { runTrustCheck } = await import("@/lib/trust/service");
    try {
      const result = await runTrustCheck(input);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result as unknown as Record<string, unknown>,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { content: [{ type: "text", text: `Trust check failed: ${msg}` }], isError: true };
    }
  },
});