CREATE TABLE public.risk_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  chain_id INTEGER NOT NULL DEFAULT 177,
  score INTEGER NOT NULL,
  level TEXT NOT NULL,
  token_name TEXT,
  token_symbol TEXT,
  summary TEXT,
  reason_codes TEXT[],
  on_chain_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX risk_scans_address_idx ON public.risk_scans (address);
CREATE INDEX risk_scans_created_idx ON public.risk_scans (created_at DESC);
GRANT SELECT, INSERT ON public.risk_scans TO anon;
GRANT SELECT, INSERT ON public.risk_scans TO authenticated;
GRANT ALL ON public.risk_scans TO service_role;
ALTER TABLE public.risk_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read risk scans" ON public.risk_scans FOR SELECT USING (true);
CREATE POLICY "Anyone can insert risk scans" ON public.risk_scans FOR INSERT WITH CHECK (true);