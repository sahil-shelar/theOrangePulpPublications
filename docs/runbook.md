# Orange Pulp - Operations Runbook

## Environments
- **Production**: `main` branch. Deployed automatically via Vercel.
- **Staging**: `develop` branch. Preview deployments on Vercel.

## Deployment Checklist
1. All Server Actions tested.
2. Migrations pushed via `supabase db push`.
3. Database types synced: `npx supabase gen types typescript --local > src/types/database.ts`
4. Environment Variables injected via Vercel Dashboard.
5. Content Health Checks pass.

## Monitoring
- **Vercel Analytics**: Audience and Web Vitals tracking.
- **Supabase Dashboard**: Database latency, connection pooling, and disk IO.
- **Custom Health Endpoint**: `/api/health`

## Incident Response
- If Edge Functions fail: Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- If Database is slow: Check `pg_stat_statements` via Supabase dashboard. Ensure indexes from `20260719000001_performance_indexes.sql` are active.
- Rollback: In Vercel, navigate to Deployments and click "Promote to Production" on the last stable build.
