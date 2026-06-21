DROP POLICY IF EXISTS "Anyone can insert risk scans" ON public.risk_scans;
REVOKE INSERT ON public.risk_scans FROM anon;
REVOKE INSERT ON public.risk_scans FROM authenticated;