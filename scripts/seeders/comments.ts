import { supabase } from '../seed/config';
import { getDeterministicUuid, getRandomDate, getRandomElement } from '../seed/helpers';

const COMMENT_BODIES = [
  "This is a fantastic read! Really enjoyed the insights.",
  "I have a different perspective on this, but good points.",
  "Thanks for sharing this detailed analysis.",
  "Can't wait to see more content like this.",
  "Very well articulated.",
  "This totally changed my mind on the topic.",
  "Great breakdown of the core issues.",
  "I strongly agree with this.",
  "Could use more sources, but an interesting take.",
  "I never thought about it that way before."
];

export async function seedComments() {
  console.log('Seeding comments...');

  const { data: articles, error: articlesError } = await supabase.from('articles').select('id');

  if (articlesError || !articles?.length) {
    console.error('Failed to fetch articles. Run --articles first.', articlesError);
    return;
  }

  // Try to get real auth users; fall back to null user_id (RLS allows it)
  let userIds: (string | null)[] = [null];
  const { data: usersData } = await supabase.auth.admin.listUsers();
  if (usersData?.users?.length) {
    userIds = usersData.users.map(u => u.id);
  }

  const comments = [];
  for (let i = 0; i < 250; i++) {
    const article = getRandomElement(articles);
    comments.push({
      id: getDeterministicUuid(`comment_${article.id}_${i}`),
      article_id: article.id,
      user_id: getRandomElement(userIds),
      content: getRandomElement(COMMENT_BODIES),
      created_at: getRandomDate(365).toISOString(),
    });
  }

  const chunkSize = 100;
  let successCount = 0;
  for (let i = 0; i < comments.length; i += chunkSize) {
    const chunk = comments.slice(i, i + chunkSize);
    const { error } = await supabase.from('comments').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error('Error seeding comments chunk:', error);
    } else {
      successCount += chunk.length;
    }
  }

  console.log(`Successfully seeded ${successCount} comments.`);
}

if (require.main === module) {
  seedComments().then(() => process.exit(0)).catch(console.error);
}
