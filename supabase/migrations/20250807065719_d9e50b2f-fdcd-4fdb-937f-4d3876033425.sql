-- Create companies table to store company research data
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Basic Information
  company_name text,
  company_website text,
  career_page text,
  founded text,
  headquarters text,
  industry text,
  number_of_employees text,
  revenue text,
  ceo text,
  
  -- Business Overview
  business_overview text,
  
  -- Key Products and Services (stored as JSONB array)
  key_products_services jsonb DEFAULT '[]'::jsonb,
  
  -- Market Position
  main_competitors text,
  market_share text,
  competitive_advantages text,
  
  -- Financial Performance
  stock_performance text,
  pe_ratio text,
  growth_rate text,
  
  -- Company Culture
  core_values text,
  work_environment text,
  employee_benefits text,
  
  -- Recent News (stored as JSONB array)
  recent_news jsonb DEFAULT '[]'::jsonb,
  
  -- SWOT Analysis
  swot_strengths text,
  swot_weaknesses text,
  swot_opportunities text,
  swot_threats text
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own company research" 
ON public.companies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own company research" 
ON public.companies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company research" 
ON public.companies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company research" 
ON public.companies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();