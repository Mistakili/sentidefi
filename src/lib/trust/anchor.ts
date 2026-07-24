import { JsonRpcProvider, Wallet, Contract } from "ethers";
import {
  BOTCHAIN_MAINNET_CHAIN_ID,
  BOTCHAIN_TESTNET_CHAIN_ID,
  getChain,
} from "@/lib/chains";

/**
 * On-chain anchoring for Safety Attestations on BotChain.
 *
 * Env:
 *   BOTCHAIN_ATTESTOR_PRIVATE_KEY — attestor key (falls back to HSK_ATTESTOR_PRIVATE_KEY)
 *   BOTCHAIN_REGISTRY_ADDRESS     — mainnet RiskRegistry (chain 677)
 *   BOTCHAIN_TESTNET_REGISTRY_ADDRESS — testnet RiskRegistry (chain 968)
 *   BOTCHAIN_RPC_URL / BOTCHAIN_TESTNET_RPC_URL — optional RPC overrides
 *   BOTCHAIN_EXPLORER / BOTCHAIN_TESTNET_EXPLORER — explorer base URLs
 */

const REGISTRY_ABI = [
  "function anchorAttestation(bytes32 attestationId, bytes32 payloadHash) external",
  "function attestationOf(bytes32 attestationId) view returns (tuple(bytes32 payloadHash, address attestor, uint64 anchoredAt))",
];

export type AnchorResult =
  | { status: "anchored"; chainId: number; txHash: string; explorerUrl: string; registry: string; attestor: string }
  | { status: "skipped"; reason: "not_requested" }
  | { status: "unconfigured"; reason: string }
  | { status: "error"; error: string };

function configForChain(chainId: number) {
  const chain = getChain(chainId);
  const pk =
    process.env.BOTCHAIN_ATTESTOR_PRIVATE_KEY ?? process.env.HSK_ATTESTOR_PRIVATE_KEY;

  if (chainId === BOTCHAIN_TESTNET_CHAIN_ID) {
    return {
      chainId,
      rpcUrl:
        process.env.BOTCHAIN_TESTNET_RPC_URL ?? chain?.rpcUrl ?? "https://rpc.bohr.life",
      registry:
        process.env.BOTCHAIN_TESTNET_REGISTRY_ADDRESS ??
        process.env.BOTCHAIN_REGISTRY_ADDRESS, // fallback if only one set
      explorer:
        process.env.BOTCHAIN_TESTNET_EXPLORER ?? chain?.explorer ?? "https://scan.bohr.life",
      pk,
    };
  }

  // Default / mainnet (677)
  return {
    chainId: BOTCHAIN_MAINNET_CHAIN_ID,
    rpcUrl: process.env.BOTCHAIN_RPC_URL ?? chain?.rpcUrl ?? "https://rpc.botchain.ai",
    registry: process.env.BOTCHAIN_REGISTRY_ADDRESS,
    explorer: process.env.BOTCHAIN_EXPLORER ?? chain?.explorer ?? "https://scan.botchain.ai",
    pk,
  };
}

export function anchoringIsConfigured(chainId: number = BOTCHAIN_MAINNET_CHAIN_ID): boolean {
  const c = configForChain(chainId);
  return Boolean(c.rpcUrl && c.pk && c.registry);
}

function hexToBytes32(hex: string): string {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  return "0x" + clean.padStart(64, "0").slice(-64);
}

export async function anchorAttestation(input: {
  receiptId: string;
  payloadHash: string;
  chainId?: number;
}): Promise<AnchorResult> {
  const chainId = input.chainId ?? BOTCHAIN_MAINNET_CHAIN_ID;
  const { rpcUrl, pk, registry, explorer } = configForChain(chainId);

  if (!rpcUrl || !pk || !registry) {
    return {
      status: "unconfigured",
      reason:
        "On-chain anchoring not configured. Set BOTCHAIN_REGISTRY_ADDRESS (mainnet) or BOTCHAIN_TESTNET_REGISTRY_ADDRESS, plus BOTCHAIN_ATTESTOR_PRIVATE_KEY.",
    };
  }

  try {
    const uuidHex =
      "0x" +
      Buffer.from(input.receiptId, "utf8").toString("hex").padStart(64, "0").slice(-64);
    const attestationId = hexToBytes32(uuidHex);

    const provider = new JsonRpcProvider(rpcUrl, chainId);
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
