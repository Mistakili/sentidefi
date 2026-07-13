# SentinelFi Phase 1: Trust API + Trust Receipts

Stop shipping features. Build one thing: a single endpoint every AI agent, wallet, and protocol calls before executing an on-chain action, and a signed Trust Receipt that proves the check happened. Everything else (policies, agent profiles, registry search UI, dashboards) is Phase 2+ and explicitly out of scope for this plan.

## What we're building

1. **Trust API** — one public endpoint: `POST /api/v1/trust/check`
2. **Trust Receipt** — every successful check emits a signed, independently verifiable receipt
3. **Chain adapter layer** — HSK today, BOT Chain next, new EVMs in ~50 lines
4. **MCP tool** — `check_trust` exposed through the existing MCP server so agents can call it natively
5. **Docs page rewrite** — a single "Integrate SentinelFi in 3 minutes" story pointed at agent/wallet/protocol devs

Not in this plan: Policy Engine, Agent Profiles, Registry search UI, dashboard redesign, BOT Chain contract deploy (we wire the adapter + config; deploy happens when BOT gives us an RPC + funded attestor).

## The endpoint

`POST /api/v1/trust/check` — public, unauthenticated, rate-limited by IP.

Request:
```
{
  "chainId": 177,
  "action": "swap" | "approve" | "transfer" | "contract_call",
  "contract": "0x…",      // required for token/contract actions
  "wallet":   "0x…",      // optional — caller's wallet
  "token":    "0x…",      // optional — token being touched
  "txData":   "0x…",      // optional — raw calldata for simulation later
  "agentId":  "string"     // optional — for future reputation
}
```

Response:
```
{
  "safe": true,
  "verdict": "ALLOW" | "WARN" | "BLOCK",
  "riskScore": 0-100,
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence": 0-100,
  "checks": {
    "verifiedContract": true,
    "isContract": true,
    "hasERC20Metadata": true,
    "bytecodeSizeOk": true,
    "knownExploit": false
  },
  "reasoning": ["Contract source verified", "…"],
  "trustReceipt": {
    "receiptId": "uuid",
    "issuedAt": "ISO8601",
    "chainId": 177,
    "contract": "0x…",
    "wallet": "0x…",
    "agentId": "…",
    "action": "swap",
    "riskScore": 18,
    "verdict": "ALLOW",
    "reasoningHash": "0x… (keccak256 of canonical reasoning)",
    "attestor": "0x…",
    "signature": "0x… (EIP-191 signature over canonical payload)"
  }
}
```

The receipt is verifiable off-chain by anyone with the attestor's public address — no chain call required. Optional on-chain anchoring reuses the existing `RiskRegistry.publish` path.

## How Phase 1 maps to what already exists

Reuse, don't rebuild:
- **Risk logic**: today's `scan_token` tool already reads `getTokenOnChainData` (contract vs EOA, ERC20 metadata, bytecode size). That becomes the initial `checks` block — we're not inventing new heuristics in Phase 1, we're wrapping the ones we have behind a stable contract.
- **Attestor keypair**: `HSK_ATTESTOR_PRIVATE_KEY` + `HSK_REGISTRY_ADDRESS` are already configured. The receipt signer uses the same key.
- **Persistence**: `risk_scans` table already exists; we add a sibling `trust_receipts` table (id, receipt_id, chain_id, contract, wallet, agent_id, action, risk_score, verdict, reasoning_hash, attestor, signature, tx_hash nullable, created_at) with a narrow `TO anon SELECT` policy for public verification.
- **MCP**: append one tool `check_trust` alongside the three existing ones. Same file layout under `src/lib/mcp/tools/`.

## Chain-agnostic architecture

Everything chain-specific gets pushed into `src/lib/chains/adapters/`:

```text
src/lib/chains/
  index.ts          # existing registry (HSK, BOT placeholder) — unchanged shape
  adapters/
    types.ts        # ChainAdapter interface
    hsk.ts          # wraps existing hsk-rpc.server.ts
    bot.ts          # stub; activates when BOT RPC lands
  registry.ts       # getAdapter(chainId) -> ChainAdapter
```

`ChainAdapter` interface:
```
getTokenOnChainData(address)
getBytecode(address)
isContract(address)
simulateTx?(txData)   // optional, Phase 2
```

The Trust API and MCP tool only talk to `getAdapter(chainId)` — they never import HSK-specific code. Adding BOT/Base/Arb = one adapter file + one entry in `CHAINS`.

## Files touched

Create:
- `src/routes/api/v1/trust.check.ts` — the public POST endpoint (under `/api/` is public on published sites, rate-limit by IP header)
- `src/lib/trust/engine.ts` — pure function: `(input, adapter) -> { checks, reasoning, riskScore, verdict, severity, confidence }`
- `src/lib/trust/receipt.ts` — canonicalize + sign + verify helpers (ethers `Wallet.signMessage` over a stable JSON string; export `verifyReceipt()` for docs)
- `src/lib/chains/adapters/{types,hsk,bot}.ts` + `src/lib/chains/registry.ts`
- `src/lib/mcp/tools/check-trust.ts` — MCP wrapper around the same engine
- One migration: `trust_receipts` table + GRANTs + RLS + public read policy

Edit:
- `src/lib/mcp/index.ts` — register `check_trust`
- `src/routes/docs.tsx` — replace body with the integration story (curl example, TS example, MCP example, "verify a receipt" snippet)
- `src/routes/index.tsx` — CTAs point at `/docs` and the API; keep "The trust infrastructure powering autonomous finance." headline; update the "How it works" section to reflect the single-endpoint story
- `src/lib/mcp/tools/scan-token.ts` — leave as-is (backwards compatible) but note in its description that `check_trust` is the preferred entrypoint

Do NOT touch: `RiskRegistry.sol`, existing `risk_scans` flow, Copilot page (it stays as a reference client), portfolio/wallet code.

## Acceptance checks

- `curl -X POST .../api/v1/trust/check` with a real HSK token returns a full verdict + signed receipt in < 2s
- The receipt verifies off-chain: `verifyReceipt(receipt)` returns the attestor address without any RPC call
- `check_trust` MCP tool is visible in `.lovable/mcp/manifest.json` after running the extractor
- Adding BOT Chain later = fill in `adapters/bot.ts` + flip `status: "live"` in the chain registry; no other file changes
- `/docs` page shows: what it is (1 line), the endpoint, a curl, a TS snippet, an MCP snippet, and how to verify a receipt

## What's explicitly deferred to Phase 2

Policy Engine, Agent Profiles, Registry search UI, dashboard redesign, transaction simulation, on-chain receipt anchoring by default, SDK package on npm, deploying `RiskRegistry.sol` to BOT Chain. Every one of these becomes trivial once Phase 1 lands because the engine and adapter boundaries are already in place.

Approve this and I'll implement it end-to-end in one pass.