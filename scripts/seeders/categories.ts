import { supabase } from '../seed/config';
import { generateSlug } from '../seed/helpers';

const CATEGORIES = [
  "Movie Reviews",
  "TV Reviews",
  "Anime",
  "Industry News",
  "Trailers",
  "Streaming",
  "OTT",
  "Box Office",
  "Awards",
  "Features",
  "Ending Explained",
  "Character Analysis",
  "Franchise Guides",
  "Rankings",
  "Spotlights"
];

export async function seedCategories() {
  console.log('Seeding categories...');
  const data = CATEGORIES.map((name) => ({
    name,
    slug: generateSlug(name),
    description: `All about ${name}`,
  }));

  const { error } = await supabase
    .from('categories')
    .upsert(data, { onConflict: 'slug' });

  if (error) {
    console.error('Error seeding categories:', error);
    throw error;
  }
  console.log('Categories seeded successfully.');
}
