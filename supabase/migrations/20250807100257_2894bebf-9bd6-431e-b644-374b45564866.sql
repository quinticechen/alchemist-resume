-- Make job_id NOT NULL and UNIQUE to ensure 1:1 relationship (if not already done)
ALTER TABLE companies 
  ALTER COLUMN job_id SET NOT NULL;

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_job_id_unique') THEN
        ALTER TABLE companies ADD CONSTRAINT companies_job_id_unique UNIQUE (job_id);
    END IF;
END $$;

-- Update RLS policies for companies table to use job relationship
DROP POLICY IF EXISTS "Users can create their own company research" ON companies;
DROP POLICY IF EXISTS "Users can view their own company research" ON companies;
DROP POLICY IF EXISTS "Users can update their own company research" ON companies;
DROP POLICY IF EXISTS "Users can delete their own company research" ON companies;

-- Create new RLS policies based on job ownership
CREATE POLICY "Users can create company research for their jobs" 
ON companies FOR INSERT 
WITH CHECK (
  job_id IN (
    SELECT id FROM jobs WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view company research for their jobs" 
ON companies FOR SELECT 
USING (
  job_id IN (
    SELECT id FROM jobs WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update company research for their jobs" 
ON companies FOR UPDATE 
USING (
  job_id IN (
    SELECT id FROM jobs WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete company research for their jobs" 
ON companies FOR DELETE 
USING (
  job_id IN (
    SELECT id FROM jobs WHERE user_id = auth.uid()
  )
);