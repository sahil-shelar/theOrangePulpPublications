import { supabase } from '../seed/config';
import { getDeterministicUuid, getRandomDate } from '../seed/helpers';

const EMAILS = ['alice', 'bob', 'carlos', 'diana', 'ethan', 'fatima', 'george', 'hannah', 'ivan', 'julia', 'kevin', 'laura', 'marcus', 'nina', 'oscar', 'priya', 'quincy', 'rachel', 'samuel', 'tanya'];
const DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'hotmail.com'];

export async function seedNewsletter() {
  console.log('Seeding newsletter subscribers...');

  const subscribers = [];
  for (let i = 0; i < 300; i++) {
    const handle = EMAILS[i % EMAILS.length];
    const domain = DOMAINS[Math.floor(i / EMAILS.length) % DOMAINS.length];
    const email = `${handle}${i}@${domain}`;

    subscribers.push({
      id: getDeterministicUuid(`newsletter-subscriber-${i}`),
      email,
      is_active: i % 10 !== 0,
      subscribed_at: getRandomDate(365).toISOString(),
    });
  }

  const chunkSize = 50;
  let successCount = 0;
  for (let i = 0; i < subscribers.length; i += chunkSize) {
    const chunk = subscribers.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error('Error seeding newsletter chunk:', error.message);
    } else {
      successCount += chunk.length;
    }
  }

  console.log(`Seeded ${successCount} newsletter subscribers.`);
}
