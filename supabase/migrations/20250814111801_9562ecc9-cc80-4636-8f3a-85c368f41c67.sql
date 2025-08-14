-- Fix critical security issue: Remove public access to sensitive customer data
-- This removes the policy that allows anyone to read all user profiles containing
-- sensitive information like emails, Stripe customer IDs, and subscription details
-- Users can still access their own profile data through the "Users can read their own profile" policy

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;