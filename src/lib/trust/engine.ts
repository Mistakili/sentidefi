import type { ChainAdapter, TokenOnChainData } from "@/lib/chains/adapters/types";

export type TrustAction = "swap" | "approve" | "transfer" | "contract_call";

export type TrustInput = {
  chainId: number;
  action: TrustAction;
  contract?: string;
  wallet?: string;
  token?: string;
  txData?: string;
  agentId?: string;
};

export type TrustChecks = {
  isContract: boolean;
  hasERC20Metadata: boolean;
  bytecodeSizeOk: boolean;
  verifiedContract: boolean;
  knownExploit: boolean;
};

export type TrustSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TrustVerdict = "ALLOW" | "WARN" | "BLOCK";
export type TrustGrade = "A" | "B" | "C" | "D" | "F";
export type TrustRecommendation =
  | "Proceed"
  | "Proceed with Caution"
  | "Manual Review Required"
  | "Block";

export type TrustEvaluation = {
  safe: boolean;
  verdict: TrustVerdict;
  trustGrade: TrustGrade;
  recommendation: TrustRecommendation;
  riskScore: number;
  severity: TrustSeverity;
  confidence: number;
  checks: TrustChecks;
  reasoning: string[];
  token: TokenOnChainData | null;
};

export function gradeFor(riskScore: number): TrustGrade {
  if (riskScore < 15) return "A";
  if (riskScore < 35) return "B";
  if (riskScore < 60) return "C";
  if (riskScore < 80) return "D";
  return "F";
}

export function recommendationFor(verdict: TrustVerdict, confidence: number): TrustRecommendation {
  if (verdict === "BLOCK") return "Block";
  if (verdict === "WARN") return "Manual Review Required";
  if (confidence < 60) return "Proceed with Caution";
  return "Proceed";
}

/**
 * Phase 1 heuristic. Deliberately small and boring — wraps the on-chain
 * signals we already have behind a stable contract. Deeper checks
 * (liquidity locks, honeypot sim, deployer history, exploit DB) plug in
 * later without changing the interface.
 */
export async function evaluateTrust(
  input: TrustInput,
  adapter: ChainAdapter,
): Promise<TrustEvaluation> {
  const target = (input.contract ?? input.token ?? "").toLowerCase();
  const reasoning: string[] = [];
  let riskScore = 10; // start optimistic
  let token: TokenOnChainData | null = null;

  const checks: TrustChecks = {
    isContract: false,
    hasERC20Metadata: false,
    bytecodeSizeOk: false,
    verifiedContract: false, // Phase 1: we don't verify sources yet
    knownExploit: false,
  };

  if (!target || !/^0x[a-f0-9]{40}$/.test(target)) {
    // Pure wallet-level or contract_call without a target — we can only say
    // "no known reason to block". Confidence is intentionally low.
    reasoning.push("No contract target provided — Phase 1 heuristics limited.");
    return {
      safe: true,
      verdict: "ALLOW",
      trustGrade: "C",
      recommendation: "Proceed with Caution",
      riskScore: 20,
      severity: "LOW",
      confidence: 30,
      checks,
      reasoning,
      token,
    };
  }

  try {
    token = await adapter.getTokenOnChainData(target);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      safe: false,
      verdict: "BLOCK",
      trustGrade: "F",
      recommendation: "Block",
      riskScore: 80,
      severity: "HIGH",
      confidence: 40,
      checks,
      reasoning: [`Chain read failed: ${msg}`],
      token,
    };
  }

  checks.isContract = token.isContract;
  checks.hasERC20Metadata = token.looksLikeERC20;
  checks.bytecodeSizeOk = token.bytecodeSize >= 200; // stubs are usually tiny

  if (!token.isContract) {
    reasoning.push("Target address is an EOA, not a contract.");
    riskScore = 60;
  } else {
    reasoning.push("Address is a deployed contract.");
    if (token.looksLikeERC20) {
      reasoning.push(`ERC20 metadata present: ${token.symbol ?? "?"} / ${token.name ?? "?"}.`);
    } else {
      reasoning.push("ERC20 metadata incomplete or non-standard.");
      riskScore += 20;
    }
    if (!checks.bytecodeSizeOk) {
      reasoning.push(`Bytecode is small (${token.bytecodeSize} bytes) — possible stub or proxy.`);
      riskScore += 15;
    } else {
      reasoning.push(`Bytecode size ${token.bytecodeSize} bytes within normal range.`);
    }
  }

  // Clamp
  riskScore = Math.max(0, Math.min(100, riskScore));

  const severity: TrustSeverity =
    riskScore >= 80 ? "CRITICAL" : riskScore >= 60 ? "HIGH" : riskScore >= 35 ? "MEDIUM" : "LOW";
  const verdict: TrustVerdict = riskScore >= 60 ? "BLOCK" : riskScore >= 35 ? "WARN" : "ALLOW";
  const safe = verdict === "ALLOW";
  const confidence = token.isContract && token.looksLikeERC20 ? 85 : 60;
  const trustGrade = gradeFor(riskScore);
  const recommendation = recommendationFor(verdict, confidence);

  return { safe, verdict, trustGrade, recommendation, riskScore, severity, confidence, checks, reasoning, token };
}