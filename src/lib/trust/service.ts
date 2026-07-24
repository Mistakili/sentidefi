import { createClient } from "@supabase/supabase-js";
import { keccak256, toUtf8Bytes } from "ethers";
import { getAdapter } from "@/lib/chains/registry";
import {
  evaluateTrust,
  type TrustGrade,
  type TrustInput,
  type TrustRecommendation,
} from "./engine";
import { signReceipt, type SafetyAttestation } from "./receipt";
import { anchorAttestation, type AnchorResult } from "./anchor";

export type TrustCheckResult = {
  safe: boolean;
  verdict: "ALLOW" | "WARN" | "BLOCK";
  trustGrade: TrustGrade;
  recommendation: TrustRecommendation;
  riskScore: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  checks: Record<string, boolean>;
  reasoning: string[];
  chainId: number;
  contract: string | null;
  wallet: string | null;
  agentId: string | null;
  action: string;
  attestation: SafetyAttestation;
  /** @deprecated use `attestation` — retained for one release for back-compat. */
  trustReceipt: SafetyAttestation;
  anchor: AnchorResult;
};

async function persistReceipt(receipt: SafetyAttestation, reasoning: string[]) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return; // best-effort — API still returns the signed receipt
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await supabase.from("trust_receipts").insert({
    receipt_id: receipt.receiptId,
    chain_id: receipt.chainId,
    contract: receipt.contract,
    wallet: receipt.wallet,
    agent_id: receipt.agentId,
    action: receipt.action,
    risk_score: receipt.riskScore,
    verdict: receipt.verdict,
    severity: receipt.severity,
    confidence: receipt.confidence,
    checks: receipt.checks,
    reasoning,
    reasoning_hash: receipt.reasoningHash,
    attestor: receipt.attestor,
    signature: receipt.signature,
  });
}

export type RunTrustCheckOptions = { anchor?: boolean };

export async function runTrustCheck(
  input: TrustInput,
  opts: RunTrustCheckOptions = {},
): Promise<TrustCheckResult> {
  const adapter = getAdapter(input.chainId);
  const evalResult = await evaluateTrust(input, adapter);

  const receipt = await signReceipt({
    chainId: input.chainId,
    contract: (input.contract ?? input.token ?? null)?.toLowerCase() ?? null,
    wallet: input.wallet?.toLowerCase() ?? null,
    agentId: input.agentId ?? null,
    action: input.action,
    riskScore: evalResult.riskScore,
    verdict: evalResult.verdict,
    trustGrade: evalResult.trustGrade,
    recommendation: evalResult.recommendation,
    severity: evalResult.severity,
    confidence: evalResult.confidence,
    checks: evalResult.checks,
    reasoning: evalResult.reasoning,
  });

  // Persist async; do not block response on failure.
  persistReceipt(receipt, evalResult.reasoning).catch(() => {});

  const anchor: AnchorResult = opts.anchor
    ? await anchorAttestation({
        receiptId: receipt.receiptId,
        payloadHash: keccak256(
          toUtf8Bytes(
            [
              receipt.receiptId,
              receipt.reasoningHash,
              receipt.signature,
            ].join("|"),
          ),
        ),
        chainId: input.chainId,
      })
    : { status: "skipped", reason: "not_requested" };

  return {
    safe: evalResult.safe,
    verdict: evalResult.verdict,
    trustGrade: evalResult.trustGrade,
    recommendation: evalResult.recommendation,
    riskScore: evalResult.riskScore,
    severity: evalResult.severity,
    confidence: evalResult.confidence,
    checks: evalResult.checks as unknown as Record<string, boolean>,
    reasoning: evalResult.reasoning,
    chainId: input.chainId,
    contract: receipt.contract,
    wallet: receipt.wallet,
    agentId: receipt.agentId,
    action: input.action,
    attestation: receipt,
    trustReceipt: receipt,
    anchor,
  };
}