import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_wallet_portfolio",
  title: "Get wallet portfolio",
  description:
    "Read a wallet's live on-chain portfolio on HSK Chain (or another supported EVM chain by chainId): native balance, tracked ERC20 balances, per-token USD prices, and total USD value.",
  inputSchema: {
    address: z
      .string()
      .regex(/^0x[0-9a-fA-F]{40}$/)
      .describe("0x-prefixed 40-char hex wallet address"),
    chainId: z
      .number()
      .int()
      .optional()
      .describe("EVM chain id (default 177 for HSK Chain)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ address, chainId }) => {
    const { fetchWalletPortfolio } = await import("@/lib/portfolio.server");
    try {
      const p = await fetchWalletPortfolio(address, chainId);
      const compact = {
        address: p.address,
        chainId: p.chainId,
        chainName: p.chainName,
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
      return {
        content: [{ type: "text", text: JSON.stringify(compact, null, 2) }],
        structuredContent: compact,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { content: [{ type: "text", text: `Portfolio fetch failed: ${msg}` }], isError: true };
    }
  },
});