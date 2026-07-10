import { defineMcp } from "@lovable.dev/mcp-js";
import scanTokenTool from "./tools/scan-token";
import getWalletPortfolioTool from "./tools/get-wallet-portfolio";
import listRecentRiskScansTool from "./tools/list-recent-risk-scans";

export default defineMcp({
  name: "sentinelfi-mcp",
  title: "SentinelFi",
  version: "0.1.0",
  instructions:
    "SentinelFi is the AI Financial Guardian for HSK Chain DeFi. Use `scan_token` to inspect any token contract before recommending a swap, `get_wallet_portfolio` to read a wallet's holdings and USD value, and `list_recent_risk_scans` to browse the public risk-verdict feed. All tools are read-only, public, and operate on live on-chain data.",
  tools: [scanTokenTool, getWalletPortfolioTool, listRecentRiskScansTool],
});