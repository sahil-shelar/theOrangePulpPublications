// One-off migration: move every account's role from user_metadata to app_metadata.
//
// Why this exists. Every authorization check in the app used to read
// `user.user_metadata.role`. Supabase lets an account write its own
// user_metadata — `auth.updateUser({ data: { role: 'admin' } })` is a normal
// client call — so "admin" meant "any signed-in user willing to set one field on
// themselves". app_metadata is writable only through the service-role admin API,
// which is why the checks now read it instead.
//
// The code change alone locks out existing staff: their role still lives in the
// old field. Run this once to copy it across.
//
//   npx tsx scripts/backfill-roles.ts          # report what would change
//   npx tsx scripts/backfill-roles.ts --apply  # write it
//
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local. It writes to the live
// project — there is no separate local database.
//
// Safe to re-run: an account that already carries app_metadata.role is skipped,
// so this never overwrites a role an admin has since corrected in the dashboard.

import type { User } from '@supabase/supabase-js'
import { supabase } from './seed/config'

const VALID_ROLES = ['admin', 'editor', 'writer', 'moderator', 'reader']

/** Supabase pages listUsers; without this the backfill silently covers page 1. */
const PER_PAGE = 200

type Outcome = 'copied' | 'already-set' | 'no-role' | 'unknown-role' | 'failed'

async function listAllUsers(): Promise<User[]> {
  const users: User[] = []

  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE })
    if (error) throw new Error(`listUsers failed on page ${page}: ${error.message}`)
    if (!data.users.length) break
    users.push(...data.users)
    if (data.users.length < PER_PAGE) break
  }

  return users
}

async function main() {
  const apply = process.argv.includes('--apply')

  const users = await listAllUsers()
  console.log(
    `Found ${users.length} accounts. Received args: ${JSON.stringify(process.argv.slice(2))}\n` +
    (apply
      ? 'APPLYING — this writes to the live Supabase project.\n'
      : 'Dry run. To write, run:  npm run backfill:roles -- --apply\n' +
        '(the bare `--` matters; without it npm keeps the flag for itself)\n')
  )

  const tally: Record<Outcome, number> = {
    'copied': 0, 'already-set': 0, 'no-role': 0, 'unknown-role': 0, 'failed': 0,
  }

  for (const user of users) {
    const label = user.email ?? user.id
    const existing = user.app_metadata?.role
    const legacy = user.user_metadata?.role

    if (existing) {
      // Already migrated, or set by hand since. Leave it alone.
      tally['already-set']++
      console.log(`  skip   ${label} — app_metadata.role is already "${existing}"`)
      continue
    }

    if (!legacy) {
      // No role anywhere. The app falls back to 'writer', which is the correct
      // floor, so this is not an error — but say so rather than inventing one.
      tally['no-role']++
      console.log(`  skip   ${label} — no role in either field (app treats as "writer")`)
      continue
    }

    if (!VALID_ROLES.includes(legacy)) {
      // Copying an unrecognised string would grant nothing but would look like a
      // successful migration. Flag it for a human instead.
      tally['unknown-role']++
      console.log(`  WARN   ${label} — unrecognised role "${legacy}", not copied`)
      continue
    }

    if (!apply) {
      tally['copied']++
      console.log(`  would  ${label} — copy "${legacy}" to app_metadata`)
      continue
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, role: legacy },
    })

    if (error) {
      tally['failed']++
      console.error(`  FAIL   ${label} — ${error.message}`)
    } else {
      tally['copied']++
      console.log(`  ok     ${label} — role "${legacy}" now in app_metadata`)
    }
  }

  console.log(
    `\n${apply ? 'Applied' : 'Would apply'}: ${tally['copied']} copied, ` +
    `${tally['already-set']} already set, ${tally['no-role']} without a role, ` +
    `${tally['unknown-role']} unrecognised, ${tally['failed']} failed.`
  )

  // The stale user_metadata.role is deliberately left in place. Nothing reads it
  // any more, and deleting it would remove the only record to fall back on if a
  // role turns out to have been copied wrong.
  if (tally['failed'] > 0) process.exitCode = 1
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
