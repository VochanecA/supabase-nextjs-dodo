-- Create ai_logs table for tracking AI usage
CREATE TABLE IF NOT EXISTS public.ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text NOT NULL,
  model text NOT NULL,
  prompt_tokens integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  input_text text,
  response_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_logs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE
);

-- Index for faster queries by customer and date
CREATE INDEX IF NOT EXISTS idx_ai_logs_customer_created ON public.ai_logs(customer_id, created_at DESC);

-- Index for token statistics
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_tokens ON public.ai_logs(created_at, total_tokens);

-- Index for model analysis
CREATE INDEX IF NOT EXISTS idx_ai_logs_model ON public.ai_logs(model);

-- Enable Row Level Security
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
CREATE POLICY "Users can view their own AI logs" ON public.ai_logs
  FOR SELECT USING (
    customer_id IN (
      SELECT customer_id FROM public.customers 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert AI logs" ON public.ai_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update AI logs" ON public.ai_logs
  FOR UPDATE USING (true);