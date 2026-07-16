/**
 * SentinelFi SDK — tiny fetch wrapper around the Trust Protocol.
 *
 * Usage:
 *   import { checkTrust, verifyAttestation, getRecommendation } from "@sentinelfi/sdk";
 *   const verdict = await checkTrust({ chainId: 968, action: "swap", contract });
 *   if (getRecommendation(verdict) !== "Proceed") throw new Error("Unsafe");
 *
 * Zero dependencies, works in browser / Node / Workers / Deno.
 */

export type TrustVerdict = "ALLOW" | "WARN" | "BLOCK";
export type TrustGrade = "A" | "B" | "C" | "D" | "F";
export type TrustRecommendation =
  | "Proceed"
  | "Proceed with Caution"
  | "Manual Review Required"
  | "Block";
export type TrustAction = "swap" | "approve" | "transfer" | "contract_call";

export type SafetyAttestation = {
  receiptId: string;
  issuedAt: string;
  chainId: number;
  contract: string | null;
  wallet: string | null;
  agentId: string | null;
  action: string;
  riskScore: number;
  verdict: TrustVerdict;
  trustGrade: TrustGrade;
  recommendation: TrustRecommendation;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  checks: Record<string, boolean>;
  reasoningHash: string;
  attestor: string;
  signature: string;
};

export type AnchorResult =
  | { status: "anchored"; chainId: number; txHash: string; explorerUrl: string; registry: string; attestor: string }
  | { status: "skipped"; reason: string }
  | { status: "unconfigured"; reason: string }
  | { status: "error"; error: string };

export type CheckTrustResult = {
  safe: boolean;
  verdict: TrustVerdict;
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
  anchor: AnchorResult;
};

export type CheckTrustInput = {
  chainId: number;
  action: TrustAction;
  contract?: string;
  wallet?: string;
  token?: string;
  agentId?: string;
  anchor?: boolean;
};

export type SdkOptions = {
  baseUrl?: string;
  fetch?: typeof fetch;
};

const DEFAULT_BASE_URL = "https://sentidefi.lovable.app";

export async function checkTrust(
  input: CheckTrustInput,
  opts: SdkOptions = {},
): Promise<CheckTrustResult> {
  const f = opts.fetch ?? fetch;
  const base = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const res = await f(`${base}/api/v1/trust/check`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SentinelFi checkTrust failed: ${res.status} ${body}`);
  }
  return (await res.json()) as CheckTrustResult;
}

export function getRecommendation(result: CheckTrustResult): TrustRecommendation {
  return result.recommendation;
}

/**
 * Off-chain verification.
 *
 * Independent verification requires the canonical payload and signature
 * scheme — this SDK ships that logic in the optional `@sentinelfi/sdk/verify`
 * entry (pulls in `ethers`). Consumers who only need to display the result
 * can trust the `attestor` field returned by the server.
 */
export async function verifyAttestation(
  attestation: SafetyAttestation,
  reasoning: string[],
): Promise<{ ok: boolean; signer: string; expected: string; reasoningHashMatches: boolean }> {
  const { verifyReceipt } = await import("@/lib/trust/receipt");
  // The server SafetyAttestation type has narrower `checks`; we widen at the
  // SDK boundary for portability, so cast at the call.
  return verifyReceipt(attestation as unknown as Parameters<typeof verifyReceipt>[0], reasoning);
}