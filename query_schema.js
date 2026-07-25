const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: comments } = await supabase.from('comments').select('*').limit(1);
  const { data: user_bookmarks } = await supabase.from('user_bookmarks').select('*').limit(1);
  const { data: articles } = await supabase.from('articles').select('*').limit(1);
  const { data: users } = await supabase.from('users').select('*').limit(1);
  
  console.log("COMMENTS SCHEMA:", comments);
  console.log("BOOKMARKS SCHEMA:", user_bookmarks);
  console.log("ARTICLES SCHEMA:", articles);
  console.log("USERS SCHEMA:", users);
}
run();
