
CREATE TABLE public.trust_receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id text NOT NULL UNIQUE,
  chain_id integer NOT NULL,
  contract text,
  wallet text,
  agent_id text,
  action text NOT NULL,
  risk_score integer NOT NULL,
  verdict text NOT NULL,
  severity text NOT NULL,
  confidence integer NOT NULL,
  checks jsonb NOT NULL DEFAULT '{}'::jsonb,
  reasoning jsonb NOT NULL DEFAULT '[]'::jsonb,
  reasoning_hash text NOT NULL,
  attestor text NOT NULL,
  signature text NOT NULL,
  tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.trust_receipts TO anon;
GRANT SELECT ON public.trust_receipts TO authenticated;
GRANT ALL ON public.trust_receipts TO service_role;

ALTER TABLE public.trust_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read trust receipts"
  ON public.trust_receipts FOR SELECT
  USING (true);

CREATE INDEX trust_receipts_created_at_idx ON public.trust_receipts (created_at DESC);
CREATE INDEX trust_receipts_contract_idx ON public.trust_receipts (contract);
CREATE INDEX trust_receipts_wallet_idx ON public.trust_receipts (wallet);
CREATE INDEX trust_receipts_agent_idx ON public.trust_receipts (agent_id);
