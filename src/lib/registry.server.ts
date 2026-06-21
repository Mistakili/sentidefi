import { JsonRpcProvider, Wallet, Contract, keccak256, toUtf8Bytes } from "ethers";

// HSK Chain testnet (HashKey Chain): chainId 133
// Public testnet RPC
const TESTNET_RPC = "https://hashkeychain-testnet.alt.technology";
const TESTNET_EXPLORER = "https://hashkeychain-testnet-explorer.alt.technology";

const REGISTRY_ABI = [
  "function publish(address token, uint8 score, uint8 level, bytes32 reasonHash) external",
  "function riskOf(address token) view returns (tuple(uint8 score, uint8 level, uint64 updatedAt, address attestor, bytes32 reasonHash))",
];

// Level enum on the contract: 0=UNKNOWN, 1=LOW, 2=MEDIUM, 3=HIGH, 4=CRITICAL
const LEVEL_MAP: Record<string, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export type OnChainPublishInput = {
  address: string;
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reasonText: string;
};

export type OnChainPublishResult =
  | {
      ok: true;
      txHash: string;
      explorerUrl: string;
      reasonHash: string;
      attestor: string;
      registry: string;
    }
  | {
      ok: false;
      error: string;
      configRequired?: boolean;
    };

export async function publishVerdictOnChain(input: OnChainPublishInput): Promise<OnChainPublishResult> {
  const registry = process.env.HSK_REGISTRY_ADDRESS;
  const pk = process.env.HSK_ATTESTOR_PRIVATE_KEY;

  if (!registry || !pk) {
    return {
      ok: false,
      configRequired: true,
      error:
        "On-chain publishing not yet configured. Deploy RiskRegistry.sol to HSK testnet, then add HSK_REGISTRY_ADDRESS and HSK_ATTESTOR_PRIVATE_KEY as secrets.",
    };
  }

  const levelNum = LEVEL_MAP[input.level];
  if (!levelNum) return { ok: false, error: `Invalid level: ${input.level}` };

  try {
    const provider = new JsonRpcProvider(TESTNET_RPC);
    const wallet = new Wallet(pk, provider);
    const contract = new Contract(registry, REGISTRY_ABI, wallet);
    const reasonHash = keccak256(toUtf8Bytes(input.reasonText));

    const tx = await contract.publish(input.address, input.score, levelNum, reasonHash);
    const receipt = await tx.wait();

    return {
      ok: true,
      txHash: tx.hash,
      explorerUrl: `${TESTNET_EXPLORER}/tx/${tx.hash}`,
      reasonHash,
      attestor: wallet.address,
      registry,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}