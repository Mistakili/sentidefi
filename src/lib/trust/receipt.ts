import { Wallet, keccak256, toUtf8Bytes, verifyMessage } from "ethers";
import { BOTCHAIN_TESTNET_CHAIN_ID } from "@/lib/chains";
import type {
  TrustChecks,
  TrustGrade,
  TrustRecommendation,
  TrustSeverity,
  TrustVerdict,
} from "./engine";

const BOTCHAIN_MAINNET_CHAIN_ID = 677;

function resolveAttestorKey(chainId: number): string {
  const isBot = chainId === BOTCHAIN_TESTNET_CHAIN_ID || chainId === BOTCHAIN_MAINNET_CHAIN_ID;
  if (isBot) {
    const bot = process.env.BOTCHAIN_ATTESTOR_PRIVATE_KEY;
    if (bot) return bot;
  }
  const hsk = process.env.HSK_ATTESTOR_PRIVATE_KEY;
  if (hsk) return hsk;
  throw new Error(
    isBot
      ? "BOTCHAIN_ATTESTOR_PRIVATE_KEY (or HSK_ATTESTOR_PRIVATE_KEY) not configured"
      : "HSK_ATTESTOR_PRIVATE_KEY not configured",
  );
}

/**
 * A cryptographically signed proof that a trust check ran with a specific
 * verdict. Externally we call this a "Safety Attestation" — same object.
 */
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
  severity: TrustSeverity;
  confidence: number;
  checks: TrustChecks;
  reasoningHash: string;
  attestor: string;
  signature: string;
};
// Back-compat alias (internal only).
export type TrustReceipt = SafetyAttestation;

export type ReceiptInput = Omit<
  SafetyAttestation,
  "receiptId" | "issuedAt" | "reasoningHash" | "attestor" | "signature"
> & { reasoning: string[] };

/**
 * Canonical string used for both the signature and reasoningHash. Any change
 * to the format is a breaking change — bump the version prefix.
 */
function canonicalPayload(
  r: Omit<SafetyAttestation, "attestor" | "signature">,
): string {
  return [
    "sentinelfi-safety-attestation/v2",
    r.receiptId,
    r.issuedAt,
    String(r.chainId),
    r.contract ?? "",
    r.wallet ?? "",
    r.agentId ?? "",
    r.action,
    String(r.riskScore),
    r.verdict,
    r.trustGrade,
    r.recommendation,
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

export async function signReceipt(input: ReceiptInput): Promise<SafetyAttestation> {
  const wallet = new Wallet(resolveAttestorKey(input.chainId));

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
    trustGrade: input.trustGrade,
    recommendation: input.recommendation,
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
export function verifyReceipt(receipt: SafetyAttestation, reasoning: string[]): {
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