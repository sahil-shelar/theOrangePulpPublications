import { supabase } from '../seed/config';
import { getDeterministicUuid, getRandomDate, getRandomElement } from '../seed/helpers';

export async function seedBookmarks() {
  console.log('Seeding bookmarks...');

  // Fetch existing articles
  const { data: articles, error: articlesError } = await supabase.from('articles').select('id');
  
  if (articlesError || !articles?.length) {
    console.error('Failed to fetch articles for bookmarks seeding.', articlesError);
    return;
  }

  // Attempt to fetch actual users from auth
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  let userIds: string[] = [];

  if (!usersError && usersData?.users?.length) {
    userIds = usersData.users.map(u => u.id);
  }

  // Fallback to mock user UUIDs if auth is restricted or empty
  if (userIds.length === 0) {
    console.log('No users found in auth.users. Creating mock users for bookmarks...');
    const mockEmails = ['reader1@orangepulp.com', 'reader2@orangepulp.com', 'reader3@orangepulp.com'];
    for (const email of mockEmails) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: 'Password123!',
        email_confirm: true
      });
      if (data?.user) {
        userIds.push(data.user.id);
      } else if (error && error.message.includes('already been registered')) {
         // Ignore if already registered
      } else {
        console.error('Error creating mock user for bookmarks:', error);
      }
    }
    
    if (userIds.length === 0) {
      userIds = mockEmails.map(getDeterministicUuid);
    }
    
    // Also upsert into public.users to satisfy foreign keys
    const mockUsers = mockEmails.map(email => ({
      id: getDeterministicUuid(email),
      email: email,
      full_name: email.split('@')[0]
    }));
    await supabase.from('users').upsert(mockUsers, { onConflict: 'id' });
  }

  const bookmarks = [];
  const existingBookmarkKeys = new Set<string>();

  // Generate around 100 bookmarks randomly
  for (let i = 0; i < 100; i++) {
    const article = getRandomElement(articles);
    const userId = getRandomElement(userIds);
    const bookmarkKey = `${userId}_${article.id}`;
    
    // Ensure uniqueness for user_bookmarks composite key or logic
    if (!existingBookmarkKeys.has(bookmarkKey)) {
      existingBookmarkKeys.add(bookmarkKey);
      
      bookmarks.push({
        user_id: userId,
        article_id: article.id,
        created_at: getRandomDate(180) // Bookmarked in the last 6 months
      });
    }
  }

  // Perform chunked upsert
  const chunkSize = 50;
  let successCount = 0;

  for (let i = 0; i < bookmarks.length; i += chunkSize) {
    const chunk = bookmarks.slice(i, i + chunkSize);
    // Depending on schema, onConflict might be 'id' or composite key 'user_id, article_id'
    // Assuming 'id' is standard if it exists, otherwise use unique constraints.
    const { error: seedError } = await supabase.from('user_bookmarks').upsert(chunk, { onConflict: 'user_id, article_id' });
    
    if (seedError) {
      console.error('Error seeding bookmarks chunk:', seedError);
    } else {
      successCount += chunk.length;
    }
  }

  console.log(`Successfully seeded ${successCount} user_bookmarks.`);
}

if (require.main === module) {
  seedBookmarks().then(() => process.exit(0)).catch(console.error);
}
