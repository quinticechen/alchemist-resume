-- Remove NOT NULL constraint from user_id since we're using job_id for 1:1 relationship
ALTER TABLE companies 
  ALTER COLUMN user_id DROP NOT NULL;