-- Add new fields to user_profiles for enhanced onboarding
ALTER TABLE public.user_profiles
  ADD COLUMN job_title TEXT,
  ADD COLUMN usage_intent TEXT CHECK (usage_intent IN ('work', 'personal', 'education'));

-- Create function to automatically create user profile when auth user is created
-- This enables email verification support by running with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    display_name,
    default_task_visibility,
    default_schedule_visibility,
    language
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
    'team',
    'team',
    'en'
  );
  RETURN NEW;
END;
$$;

-- Create trigger to call function on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
