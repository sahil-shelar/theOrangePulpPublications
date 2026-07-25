import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatency = 0;

  try {
    const supabase = await createClient();
    // Use a lightweight query to check db connection
    const { error } = await supabase.from('site_settings').select('id').limit(1);
    if (error) {
      dbStatus = 'unhealthy';
      console.error('Health Check DB Error:', error);
    }
  } catch (error) {
    dbStatus = 'unhealthy';
    console.error('Health Check Exception:', error);
  }

  dbLatency = Date.now() - startTime;

  const health = {
    status: dbStatus === 'healthy' ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: {
        status: dbStatus,
        latency_ms: dbLatency,
      }
    },
    environment: process.env.NODE_ENV
  };

  return NextResponse.json(health, { 
    status: health.status === 'ok' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    }
  });
}
