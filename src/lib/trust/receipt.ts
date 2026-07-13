import { Wallet, keccak256, toUtf8Bytes, verifyMessage } from "ethers";
import type { TrustChecks, TrustSeverity, TrustVerdict } from "./engine";

export type TrustReceipt = {
  receiptId: string;
  issuedAt: string;
  chainId: number;
  contract: string | null;
  wallet: string | null;
  agentId: string | null;
  action: string;
  riskScore: number;
  verdict: TrustVerdict;
  severity: TrustSeverity;
  confidence: number;
  checks: TrustChecks;
  reasoningHash: string;
  attestor: string;
  signature: string;
};

export type ReceiptInput = Omit<
  TrustReceipt,
  "receiptId" | "issuedAt" | "reasoningHash" | "attestor" | "signature"
> & { reasoning: string[] };

/**
 * Canonical string used for both the signature and reasoningHash. Any change
 * to the format is a breaking change — bump the version prefix.
 */
function canonicalPayload(
  r: Omit<TrustReceipt, "attestor" | "signature">,
): string {
  return [
    "sentinelfi-trust-receipt/v1",
    r.receiptId,
    r.issuedAt,
    String(r.chainId),
    r.contract ?? "",
    r.wallet ?? "",
    r.agentId ?? "",
    r.action,
    String(r.riskScore),
    r.verdict,
    r.severity,
    String(r.confidence),
    JSON.stringify(r.checks),
    r.reasoningHash,
  ].join("|");
}

export function hashReasoning(reasoning: string[]): string {
  return keccak256(toUtf8Bytes(JSON.stringify(reasoning)));
}

function randomId(): string {
  // Cloudflare Workers + Node both expose crypto.randomUUID.
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  return g.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function signReceipt(input: ReceiptInput): Promise<TrustReceipt> {
  const pk = process.env.HSK_ATTESTOR_PRIVATE_KEY;
  if (!pk) throw new Error("HSK_ATTESTOR_PRIVATE_KEY not configured");
  const wallet = new Wallet(pk);

  const receiptId = randomId();
  const issuedAt = new Date().toISOString();
  const reasoningHash = hashReasoning(input.reasoning);

  const partial = {
    receiptId,
    issuedAt,
    chainId: input.chainId,
    contract: input.contract ?? null,
    wallet: input.wallet ?? null,
    agentId: input.agentId ?? null,
    action: input.action,
    riskScore: input.riskScore,
    verdict: input.verdict,
    severity: input.severity,
    confidence: input.confidence,
    checks: input.checks,
    reasoningHash,
  };

  const signature = await wallet.signMessage(canonicalPayload(partial));

  return {
    ...partial,
    attestor: wallet.address,
    signature,
  };
}

/**
 * Recover the signer from a receipt and reasoning. Callers can verify
 * receipts entirely off-chain given only the attestor's public address.
 */
export function verifyReceipt(receipt: TrustReceipt, reasoning: string[]): {
  ok: boolean;
  signer: string;
  expected: string;
  reasoningHashMatches: boolean;
} {
  const reasoningHashMatches = hashReasoning(reasoning) === receipt.reasoningHash;
  const { attestor, signature, ...rest } = receipt;
  const signer = verifyMessage(canonicalPayload(rest), signature);
  return {
    ok: reasoningHashMatches && signer.toLowerCase() === attestor.toLowerCase(),
    signer,
    expected: attestor,
    reasoningHashMatches,
  };
}