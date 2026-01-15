-- ==============================================
-- FIX: User Bank Details Security
-- ==============================================

-- Create masked view for user_bank_details
CREATE OR REPLACE VIEW public.user_bank_details_masked
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  '****' || RIGHT(account_number, 4) as account_number_masked,
  LEFT(account_holder_name, 2) || '***' as account_holder_masked,
  '***Bank' as bank_name_masked,
  '****' || RIGHT(ifsc_code, 4) as ifsc_masked,
  is_primary,
  created_at,
  updated_at
FROM public.user_bank_details;

-- ==============================================
-- FIX: Block client modifications on coin_transactions
-- ==============================================

CREATE POLICY "Block client inserts on coin_transactions"
ON public.coin_transactions
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Block client updates on coin_transactions"
ON public.coin_transactions
FOR UPDATE
USING (false);

CREATE POLICY "Block client deletes on coin_transactions"
ON public.coin_transactions
FOR DELETE
USING (false);

-- ==============================================
-- FIX: Block client modifications on earnings
-- ==============================================

CREATE POLICY "Block client inserts on earnings"
ON public.earnings
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Block client updates on earnings"
ON public.earnings
FOR UPDATE
USING (false);

CREATE POLICY "Block client deletes on earnings"
ON public.earnings
FOR DELETE
USING (false);