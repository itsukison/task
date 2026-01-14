/**
 * Supabase Configuration
 * 
 * Set these environment variables in your .env.local file:
 * NEXT_PUBLIC_SUPABASE_URL=https://dwhwjjogtrqzovrkwisd.supabase.co
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHdqam9ndHJxem92cmt3aXNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQ2ODIsImV4cCI6MjA4Mzk0MDY4Mn0.KxTVQWdTb3TOAe6YHx9siuO1TAnTUsSbdzvXm4XQaPk
 */

export const config = {
    supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },
} as const
