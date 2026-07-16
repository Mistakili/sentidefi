/**
 * Smoke-test BOT testnet trust flow without starting the full dev server.
 * Usage: node scripts/test-bot-trust.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (m) process.env[m[1]] = m[2];
}

const { botchainAdapter } = await import("../src/lib/chains/adapters/botchain.ts");
const { evaluateTrust } = await import("../src/lib/trust/engine.ts");
const { signReceipt } = await import("../src/lib/trust/receipt.ts");

const chainId = 968;
const contract = "0x0000000000000000000000000000000000000001";

const token = await botchainAdapter.getTokenOnChainData(contract);
console.log("adapter chainId:", botchainAdapter.chainId);
console.log("token read:", { isContract: token.isContract, chainId: token.chainId, rpcUrl: token.rpcUrl });

const evaluation = await evaluateTrust(
  { chainId, action: "swap", contract },
  botchainAdapter,
);
console.log("evaluation:", {
  verdict: evaluation.verdict,
  trustGrade: evaluation.trustGrade,
  riskScore: evaluation.riskScore,
  reasoning: evaluation.reasoning,
});

const receipt = await signReceipt({
  chainId,
  contract,
  wallet: null,
  agentId: "smoke-test",
  action: "swap",
  riskScore: evaluation.riskScore,
  verdict: evaluation.verdict,
  trustGrade: evaluation.trustGrade,
  recommendation: evaluation.recommendation,
  severity: evaluation.severity,
  confidence: evaluation.confidence,
  checks: evaluation.checks,
  reasoning: evaluation.reasoning,
});
console.log("attestation:", {
  receiptId: receipt.receiptId,
  attestor: receipt.attestor,
  chainId: receipt.chainId,
  signature: receipt.signature.slice(0, 18) + "…",
});

console.log("\n✓ BOT testnet trust flow OK (off-chain signing + RPC reads)");