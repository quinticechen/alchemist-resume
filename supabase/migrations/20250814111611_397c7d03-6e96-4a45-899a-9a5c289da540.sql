-- Fix security issue: Remove public access to private resume files
-- This removes the policy that allows anyone to read all resumes
-- Users can still access their own resumes through the "Users can read own resumes" policy

DROP POLICY IF EXISTS "Public resumes are viewable by everyone" ON public.resumes;