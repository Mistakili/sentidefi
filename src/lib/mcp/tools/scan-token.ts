import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "scan_token",
  title: "Scan HSK token",
  description:
    "Fetch live on-chain data for a token contract on HSK Chain (chainId 177): whether the address is a contract or EOA, ERC20 metadata (name, symbol, decimals, totalSupply), and bytecode size. Use as the first step for any risk analysis of a token address.",
  inputSchema: {
    address: z
      .string()
      .regex(/^0x[0-9a-fA-F]{40}$/)
      .describe("0x-prefixed 40-char hex token contract address on HSK Chain"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ address }) => {
    const { getTokenOnChainData } = await import("@/lib/hsk-rpc.server");
    try {
      const data = await getTokenOnChainData(address);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        structuredContent: data as Record<string, unknown>,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { content: [{ type: "text", text: `Scan failed: ${msg}` }], isError: true };
    }
  },
});