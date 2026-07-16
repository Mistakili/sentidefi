import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "check_trust",
  title: "Check trust (SentinelFi Trust Protocol)",
  description:
    "The trust checkpoint every AI agent, wallet, or protocol should call before executing an on-chain action. Returns a clear recommendation (Proceed / Proceed with Caution / Manual Review Required / Block), a Trust Grade (A–F), a risk score, plain-English reasoning, and a cryptographically signed Safety Attestation any third party can verify off-chain with only the attestor's public address. HSK Chain live today; BotChain and additional EVMs plug into the same interface.",
  inputSchema: {
    chainId: z.number().int().describe("EVM chain id (177 = HSK Chain, 968 = BotChain Testnet)."),
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
    anchor: z
      .boolean()
      .optional()
      .describe(
        "If true, also anchor the Safety Attestation on-chain (BotChain RiskRegistry). Requires BotChain configuration.",
      ),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
  handler: async (input) => {
    const { runTrustCheck } = await import("@/lib/trust/service");
    try {
      const { anchor, ...trustInput } = input;
      const result = await runTrustCheck(trustInput, { anchor });
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