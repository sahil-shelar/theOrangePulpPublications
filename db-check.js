const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabaseUrl = 'http://127.0.0.1:54321'; // local dev server
  const supabaseKey = 'dummy'; // not needed for raw sql if we use psql
}
test();
