-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Clear previous cron job if exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'sync-knowledge-every-10-min'
  ) THEN
    PERFORM cron.unschedule('sync-knowledge-every-10-min');
  END IF;
END $$;

-- Setup Cron trigger to hit Edge Function every 10 minutes
SELECT cron.schedule(
    'sync-knowledge-every-10-min', 
    '*/10 * * * *', 
    $$
    SELECT net.http_post(
        url:='https://sisydugbdmlsqvgikpyd.supabase.co/functions/v1/sync-knowledge'
    )
    $$
);
