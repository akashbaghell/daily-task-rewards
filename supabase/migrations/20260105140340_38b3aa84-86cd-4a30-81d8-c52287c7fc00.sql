-- Create table to store user's saved bank details
CREATE TABLE public.user_bank_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_bank_details ENABLE ROW LEVEL SECURITY;

-- Users can view their own bank details
CREATE POLICY "Users can view own bank details"
ON public.user_bank_details
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own bank details
CREATE POLICY "Users can insert own bank details"
ON public.user_bank_details
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own bank details
CREATE POLICY "Users can update own bank details"
ON public.user_bank_details
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own bank details
CREATE POLICY "Users can delete own bank details"
ON public.user_bank_details
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all bank details
CREATE POLICY "Admins can view all bank details"
ON public.user_bank_details
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_user_bank_details_updated_at
BEFORE UPDATE ON public.user_bank_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();