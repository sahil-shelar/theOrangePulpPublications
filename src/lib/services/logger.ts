import { createClient } from '@/lib/supabase/server';

type LogLevel = 'info' | 'warn' | 'error' | 'fatal';
type LogCategory = 'auth' | 'publish' | 'delete' | 'tmdb_import' | 'job' | 'media' | 'settings' | 'system';

interface LogPayload {
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, any>;
  user_id?: string;
}

export async function logEvent(payload: LogPayload) {
  // In a production app, we would write to an external logging service (Datadog, Sentry, Axiom, etc.)
  // We also print structured JSON to stdout for container log aggregators.
  const logEntry = {
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    ...payload
  };

  if (payload.level === 'error' || payload.level === 'fatal') {
    console.error(JSON.stringify(logEntry));
  } else if (payload.level === 'warn') {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.info(JSON.stringify(logEntry));
  }

  // Optionally persist critical audit logs to Supabase
  if (payload.level === 'error' || payload.level === 'fatal' || ['auth', 'publish', 'settings'].includes(payload.category)) {
    try {
      const supabase = await createClient();
      await supabase.from('jobs').insert({
        job_type: 'audit_log',
        payload: logEntry,
        status: 'Completed'
      });
    } catch (e) {
      console.error('Failed to persist audit log to DB:', e);
    }
  }
}
