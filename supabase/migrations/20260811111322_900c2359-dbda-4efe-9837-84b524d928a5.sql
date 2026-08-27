CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('casa-hub-notification-processor')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'casa-hub-notification-processor');

SELECT cron.schedule(
  'casa-hub-notification-processor',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://frtbirigrhggyyxcqann.supabase.co/functions/v1/notification-processor',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZydGJpcmlncmhnZ3l5eGNxYW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NTIxNjIsImV4cCI6MjEwMDIyODE2Mn0.Z7jM5JJpLXxRO-fKGkCqvmzDBUNBpAww8R5cBz09jpQ","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZydGJpcmlncmhnZ3l5eGNxYW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NTIxNjIsImV4cCI6MjEwMDIyODE2Mn0.Z7jM5JJpLXxRO-fKGkCqvmzDBUNBpAww8R5cBz09jpQ"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);