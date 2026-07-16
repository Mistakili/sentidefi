import { JsonRpcProvider, Wallet, Contract } from "ethers";
import { BOTCHAIN_TESTNET_CHAIN_ID, getChain } from "@/lib/chains";

/**
 * On-chain anchoring for Safety Attestations.
 *
 * Off-chain the attestation is already provable — signature + reasoning hash.
 * Anchoring writes the attestation id + payload hash to a lightweight
 * RiskRegistry contract so anyone (block explorer, third party, dashboard)
 * can look it up on-chain without hitting SentinelFi.
 *
 * Env config (BotChain-first, HSK fallback):
 *   BOTCHAIN_RPC_URL              — target RPC
 *   BOTCHAIN_ATTESTOR_PRIVATE_KEY — attestor key (falls back to HSK_ATTESTOR_PRIVATE_KEY)
 *   BOTCHAIN_REGISTRY_ADDRESS     — deployed RiskRegistry
 *   BOTCHAIN_EXPLORER             — block explorer base URL for tx links
 */

// Minimal ABI — one write, one read. Matches the Phase-1 registry.
const REGISTRY_ABI = [
  "function anchorAttestation(bytes32 attestationId, bytes32 payloadHash) external",
  "function attestationOf(bytes32 attestationId) view returns (tuple(bytes32 payloadHash, address attestor, uint64 anchoredAt))",
];

export type AnchorResult =
  | { status: "anchored"; chainId: number; txHash: string; explorerUrl: string; registry: string; attestor: string }
  | { status: "skipped"; reason: "not_requested" }
  | { status: "unconfigured"; reason: string }
  | { status: "error"; error: string };

function envConfig() {
  const chain = getChain(BOTCHAIN_TESTNET_CHAIN_ID);
  const rpcUrl = process.env.BOTCHAIN_RPC_URL ?? chain?.rpcUrl ?? "https://rpc.bohr.life";
  const pk =
    process.env.BOTCHAIN_ATTESTOR_PRIVATE_KEY ?? process.env.HSK_ATTESTOR_PRIVATE_KEY;
  const registry = process.env.BOTCHAIN_REGISTRY_ADDRESS;
  const explorer = process.env.BOTCHAIN_EXPLORER ?? chain?.explorer ?? "https://scan.bohr.life";
  const chainId = Number(process.env.BOTCHAIN_CHAIN_ID ?? BOTCHAIN_TESTNET_CHAIN_ID);
  return { rpcUrl, pk, registry, explorer, chainId };
}

export function anchoringIsConfigured(): boolean {
  const c = envConfig();
  return Boolean(c.rpcUrl && c.pk && c.registry);
}

function hexToBytes32(hex: string): string {
  // Trust API generates receiptId as a UUID (36 chars). Pack it into 32 bytes
  // by hashing to a stable bytes32 for on-chain storage.
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  return "0x" + clean.padStart(64, "0").slice(-64);
}

export async function anchorAttestation(input: {
  receiptId: string;
  payloadHash: string; // 0x… keccak256 of canonical payload
}): Promise<AnchorResult> {
  const { rpcUrl, pk, registry, explorer, chainId } = envConfig();
  if (!rpcUrl || !pk || !registry) {
    return {
      status: "unconfigured",
      reason:
        "On-chain anchoring not configured. Set BOTCHAIN_RPC_URL, BOTCHAIN_REGISTRY_ADDRESS, and BOTCHAIN_ATTESTOR_PRIVATE_KEY (or reuse HSK_ATTESTOR_PRIVATE_KEY).",
    };
  }

  try {
    // Turn the UUID-shaped receiptId into a bytes32 by taking a keccak
    // (via ethers' identity: we just hex-encode the utf8 bytes and pad).
    const uuidHex =
      "0x" +
      Buffer.from(input.receiptId, "utf8").toString("hex").padStart(64, "0").slice(-64);
    const attestationId = hexToBytes32(uuidHex);

    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(pk, provider);
    const contract = new Contract(registry, REGISTRY_ABI, wallet);
    const tx = await contract.anchorAttestation(attestationId, input.payloadHash);
    await tx.wait();
    return {
      status: "anchored",
      chainId,
      txHash: tx.hash,
      explorerUrl: explorer ? `${explorer.replace(/\/$/, "")}/tx/${tx.hash}` : "",
      registry,
      attestor: wallet.address,
    };
  } catch (e) {
    return { status: "error", error: e instanceof Error ? e.message : String(e) };
  }
}