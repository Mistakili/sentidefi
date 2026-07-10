
# Reposition SentinelFi → Trust Infrastructure (and how BotChain plugs in)

Agreed with the analysis. Two shifts, in this order.

---

## Part 1 — Reposition the landing page (this turn)

Goal: stop sounding like "another AI safety app," start sounding like a category-defining infrastructure layer that agents *and* humans depend on. De-emphasize the Copilot to a reference client.

### 1. Hero rewrite (`src/routes/index.tsx`)

- **Eyebrow / category tag:** `Trust Infrastructure for Autonomous Finance`
- **Headline:** `The trust layer every wallet, protocol, and AI agent calls before touching an EVM chain.`
- **Subhead:** `Every autonomous action needs a risk check. SentinelFi is the shared, public infrastructure that makes on-chain execution safe — for humans, wallets, and agents.`
- **Primary CTA:** `Read the docs` → `/docs`
- **Secondary CTA:** `Try the Copilot (reference client)` → `/copilot`
  Renaming the CTA reframes Copilot as a demo of the infra, not the product.

### 2. Language scrub across the page

Remove or downgrade the word "AI" everywhere it isn't load-bearing. Replace with: **agents, copilots, wallets, automation, infrastructure, trust, risk intelligence, MCP**.

Specific swaps:
- "AI Copilot" → "Reference Copilot" (and demote in nav order: Docs, MCP, Copilot)
- "AI agents call…" → "Agents, wallets, and copilots call…"
- "AI-generated verdict" → "Risk verdict"
- `WhyNow` headline → `Autonomous finance is arriving faster than its safety layer.`

### 3. Restructure sections into an infra narrative

Replace the current section order with:

1. **Hero** (above)
2. **The three primitives** — a single strip showing what SentinelFi actually is:
   - `MCP Endpoint` — one URL, three read-only tools
   - `Risk Registry` — public, on-chain verdicts with tx-hash provenance
   - `Risk Intelligence Feed` — every scan, queryable by anyone
3. **Why now** (rewritten, no "AI" first-word framing)
4. **Live metrics strip** (keep — real numbers from `risk_scans` are the strongest infra signal)
5. **Built for** — reframe as *"Who plugs into SentinelFi"*: Wallets · Protocols · Chains · Agents (four columns, not a logo row of AI clients only)
6. **Copilot as reference client** — one small card, honest label: *"See how an agent uses SentinelFi. The Copilot is a reference implementation — the same tools are available to any MCP client."*
7. **For builders** — code snippet of an MCP call, link to `/docs`
8. **Footer CTA:** `Don't sign blind. Scan first.` (keep)

### 4. Metadata (`head()` in `src/routes/index.tsx`)

- `<title>`: `SentinelFi — Trust Infrastructure for Autonomous Finance`
- `<meta name="description">`: `The public trust layer every wallet, protocol, and AI agent calls before touching an EVM chain. MCP-native, chain-agnostic, launched on HSK.`
- Matching `og:title` / `og:description` / `twitter:card`.

### 5. Docs page (`src/routes/docs.tsx`) — light touch

Update the opening paragraph and page `<title>` to mirror the new positioning ("Trust Infrastructure for Autonomous Finance"). No structural rewrite this turn.

**Out of scope this turn:** backend, MCP tools, contracts, Copilot UI internals. Pure positioning/frontend.

---

## Part 2 — The BotChain playbook (do NOT build this turn)

This is the strategic answer to *"when it's time to focus on BotChain, how do we do it?"* — captured so we execute cleanly when the moment comes. Nothing here ships today.

The whole point of the infrastructure framing is that **onboarding a new chain should be boring**. On SentinelFi's current architecture, BotChain support is a config change plus a dataset, not a rebuild.

### Step 1 — Flip the chain registry (1 file)
`src/lib/chains.ts` already has a `BOTCHAIN` placeholder with `status: "coming-soon"`.
When BotChain publishes its production RPC + explorer:
- Fill in `rpcUrl`, `explorer`, `nativeCurrency`
- Add the top ~5 tracked tokens (native + major stables + wrapped native)
- Flip `status: "live"`

Every consumer (`getLiveChain`, `LIVE_CHAINS`, portfolio, MCP tools) picks it up automatically. Zero code changes elsewhere.

### Step 2 — Extend the MCP tools with an explicit `chainId`
`scan_token` and `get_wallet_portfolio` already accept `chainId` (default HSK). `list_recent_risk_scans` needs one small addition: a `chain_id` column on `risk_scans` + optional filter in the tool. Migration + tool patch, ~30 min of work.

### Step 3 — Wallet UX
`WalletButton` already supports `wallet_switchEthereumChain`. Add BotChain to the switcher dropdown once step 1 lands.

### Step 4 — On-chain attestation on BotChain
Deploy the existing `contracts/RiskRegistry.sol` to BotChain testnet, add its address to `src/lib/registry.server.ts` chain map. Same contract, same ABI — the whole point of writing it chain-agnostic.

### Step 5 — Positioning move (this is the real work)
The technical lift is small. The *narrative* lift is what wins:
- Publish a "BotChain support is live" post the day their mainnet opens
- Seed the public `risk_scans` feed with the first N BotChain contracts *before* announcing — so the feed already looks alive
- Pitch BotChain's foundation directly: *"You don't need to build a scanner. SentinelFi is already there."* This is exactly the wallet/chain cold-start pitch on the current README, applied concretely.
- Add BotChain to the `/docs` "Supported chains" table and the landing page's chain badges

### Step 6 — Repeat for every EVM chain after
Base, BSC, Arbitrum, HyperEVM — same 6 steps. The moat is that we've done it once cleanly, so doing it again is a config PR.

**Trigger to execute Part 2:** BotChain mainnet RPC is public and stable, OR HSK hackathon results give us a reason to expand publicly. Until then, keep the placeholder visible on the site as a "coming soon" credibility signal (already handled by `LIVE_CHAINS` filter).

---

## Approve to build Part 1 now

Part 2 is documented and ready — no code changes today. Say the word and I'll ship the repositioning in a single edit to `src/routes/index.tsx` (plus the small `docs.tsx` header tweak).
