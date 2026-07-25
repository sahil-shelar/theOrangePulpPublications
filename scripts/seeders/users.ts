import { supabase } from '../seed/config';
// No additional helpers needed

export async function seedUsers() {
  console.log('Seeding users...');
  
  const usersToSeed = [
    { email: 'admin@orangepulp.com', password: 'password123', role: 'admin' },
    { email: 'moderator@orangepulp.com', password: 'password123', role: 'moderator' },
    { email: 'reader1@orangepulp.com', password: 'password123', role: 'reader' },
    { email: 'reader2@orangepulp.com', password: 'password123', role: 'reader' },
    { email: 'reader3@orangepulp.com', password: 'password123', role: 'reader' },
  ];

  let authRestricted = false;

  for (const u of usersToSeed) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { role: u.role },
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
