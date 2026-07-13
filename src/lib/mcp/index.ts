import { defineMcp } from "@lovable.dev/mcp-js";
import checkTrustTool from "./tools/check-trust";
import scanTokenTool from "./tools/scan-token";
import getWalletPortfolioTool from "./tools/get-wallet-portfolio";
import listRecentRiskScansTool from "./tools/list-recent-risk-scans";

export default defineMcp({
  name: "sentinelfi-mcp",
  title: "SentinelFi",
  version: "0.1.0",
  instructions:
    "SentinelFi is the trust infrastructure for autonomous finance. Before any AI agent, wallet, or protocol executes an on-chain action, call `check_trust` — it returns a structured ALLOW/WARN/BLOCK verdict and a signed Trust Receipt that can be verified off-chain. The other tools are lower-level helpers: `scan_token` for raw on-chain metadata, `get_wallet_portfolio` for balances, `list_recent_risk_scans` for the public verdict feed. All tools are read-only and operate on live on-chain data.",
  tools: [checkTrustTool, scanTokenTool, getWalletPortfolioTool, listRecentRiskScansTool],
});