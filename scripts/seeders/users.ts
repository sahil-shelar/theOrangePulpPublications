import { supabase } from '../seed/config';
// No additional helpers needed

/**
 * Password for every seeded account, read from the environment.
 *
 * There is no default. The literal 'password123' used to live in this file, and
 * because the dev server and the deployed app share one Supabase project, that
 * shipped a known admin credential against production data. Seeding now refuses
 * to run rather than creating accounts with a guessable password.
 */
function seedPassword(): string {
  const password = process.env.SEED_USER_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error(
      'SEED_USER_PASSWORD must be set to at least 12 characters before seeding users. ' +
      'These accounts are created against the live Supabase project.'
    );
  }
  return password;
}

export async function seedUsers() {
  console.log('Seeding users...');

  const password = seedPassword();

  const usersToSeed = [
    { email: 'admin@orangepulp.com', role: 'admin' },
    { email: 'moderator@orangepulp.com', role: 'moderator' },
    { email: 'reader1@orangepulp.com', role: 'reader' },
    { email: 'reader2@orangepulp.com', role: 'reader' },
    { email: 'reader3@orangepulp.com', role: 'reader' },
  ];

  let authRestricted = false;

  for (const u of usersToSeed) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password,
      email_confirm: true,
      // app_metadata, not user_metadata: the latter is writable by the account
      // itself, so a seeded reader could promote themselves to admin.
      app_metadata: { role: u.role },
    });

    if (error) {
      if (error.message.includes('already been registered') || error.status === 422) {
        console.log(`User ${u.email} already exists.`);
      } else {
        console.warn(`Could not create user ${u.email} via admin API:`, error.message);
        authRestricted = true;
        break;
      }
    } else {
      console.log(`Created user ${u.email} with role ${u.role} (ID: ${data.user.id})`);
    }
  }

  if (authRestricted) {
    console.log('auth.users seems restricted. Using mock users for relations.');
  } else {
    console.log('Successfully completed user seeding.');
  }
}

if (require.main === module) {
  seedUsers().then(() => process.exit(0)).catch(console.error);
}
