import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_recent_risk_scans",
  title: "List recent risk scans",
  description:
    "Read the SentinelFi public risk-scan feed: the most recent AI-generated risk verdicts for HSK Chain token contracts, including score (0-100), level (LOW/MEDIUM/HIGH/CRITICAL), a plain-English summary, and — when attested — the on-chain transaction hash.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("How many recent scans to return (1-50, default 10)."),
    address: z
      .string()
      .regex(/^0x[0-9a-fA-F]{40}$/)
      .optional()
      .describe("Optional token address filter — return only scans for this contract."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
  handler: async ({ limit, address }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return {
        content: [{ type: "text", text: "Backend not configured" }],
        isError: true,
      };
    }
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let q = supabase
      .from("risk_scans")
      .select(
        "address,score,level,token_name,token_symbol,summary,reason_codes,tx_hash,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (address) q = q.eq("address", address.toLowerCase());
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: `Feed error: ${error.message}` }], isError: true };
    }
    const rows = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { count: rows.length, scans: rows },
    };
  },
});