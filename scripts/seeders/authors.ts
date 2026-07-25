import { supabase } from '../seed/config';
import { generateSlug } from '../seed/helpers';

const AUTHORS = [
  {
    name: "Alex Mercer",
    bio: "Senior film critic with over a decade of experience covering international film festivals. Specializes in indie cinema and foreign language films.",
    role: "Senior Editor",
    twitter_handle: "@alexmercerfilm",
    avatar_url: "https://i.pravatar.cc/150?u=alexmercer"
  },
  {
    name: "Samantha Reed",
    bio: "Pop culture aficionado and TV addict. Samantha covers everything from the latest streaming binges to deep-dives into reality television.",
    role: "Staff Writer",
    twitter_handle: "@samreedtv",
    avatar_url: "https://i.pravatar.cc/150?u=samreed"
  },
  {
    name: "Marcus Chen",
    bio: "Anime enthusiast and manga reader. Marcus writes extensive reviews on seasonal anime and loves breaking down complex animation sequences.",
    role: "Anime Columnist",
    twitter_handle: "@marcuschen_otaku",
    avatar_url: "https://i.pravatar.cc/150?u=marcuschen"
  },
  {
    name: "Elena Rodriguez",
    bio: "Box office analyst and industry insider. Elena provides weekly reports on theatrical earnings and studio mergers.",
    role: "Industry Analyst",
    twitter_handle: "@elenarodriguezbox",
    avatar_url: "https://i.pravatar.cc/150?u=elenarodriguez"
  },
  {
    name: "David Kim",
    bio: "Horror hound and suspense lover. David reviews everything that goes bump in the night, from slasher classics to elevated horror.",
    role: "Contributing Writer",
    twitter_handle: "@davidkimhorror",
    avatar_url: "https://i.pravatar.cc/150?u=davidkim"
  },
  {
    name: "Sarah Jenkins",
    bio: "Sci-Fi and fantasy expert. She loves dissecting the lore of massive franchises like Star Wars and Lord of the Rings.",
    role: "Features Editor",
    twitter_handle: "@sarahj_scifi",
    avatar_url: "https://i.pravatar.cc/150?u=sarahjenkins"
  },
  {
    name: "Michael Thompson",
    bio: "Long-time comic book fan turned superhero movie critic. Michael breaks down easter eggs and post-credit scenes for the MCU and DCU.",
    role: "Staff Writer",
    twitter_handle: "@mthompsoncomics",
    avatar_url: "https://i.pravatar.cc/150?u=michaelthompson"
  },
  {
    name: "Jessica Barnes",
    bio: "Focuses on the art of filmmaking, including cinematography and editing. Jessica regularly interviews behind-the-scenes crew members.",
    role: "Senior Correspondent",
    twitter_handle: "@jessbarnesfilm",
    avatar_url: "https://i.pravatar.cc/150?u=jessicabarnes"
  },
  {
    name: "Omar Farooq",
    bio: "Action movie junkie and stunt appreciation advocate. Omar's reviews often focus on choreography and practical effects.",
    role: "Contributing Writer",
    twitter_handle: "@omarfaction",
    avatar_url: "https://i.pravatar.cc/150?u=omarfarooq"
  },
  {
    name: "Chloe Evans",
    bio: "Oscar prognosticator and awards season specialist. Chloe tracks campaign narratives and predicts the major category winners.",
    role: "Awards Columnist",
    twitter_handle: "@chloeevansoscars",
    avatar_url: "https://i.pravatar.cc/150?u=chloeevans"
  },
  {
    name: "Liam O'Connor",
    bio: "Retro gaming and movie crossover enthusiast. Liam explores the intersection of interactive media and traditional storytelling.",
    role: "Tech & Media Writer",
    twitter_handle: "@liamoc_games",
    avatar_url: "https://i.pravatar.cc/150?u=liamoconnor"
  },
  {
    name: "Priya Patel",
    bio: "Specialist in South Asian cinema and Bollywood. Priya highlights global hits and hidden gems from the subcontinent.",
    role: "International Editor",
    twitter_handle: "@priyapatelcinema",
    avatar_url: "https://i.pravatar.cc/150?u=priyapatel"
  },
  {
    name: "Kevin Wright",
    bio: "Comedy connoisseur. Kevin covers stand-up specials, sitcoms, and comedic movies with a sharp wit.",
    role: "Staff Writer",
    twitter_handle: "@kevinwrightlaughs",
    avatar_url: "https://i.pravatar.cc/150?u=kevinwright"
  },
  {
    name: "Natalie Foster",
    bio: "Documentary filmmaker and reviewer. Natalie focuses on non-fiction storytelling and true crime series.",
    role: "Features Writer",
    twitter_handle: "@nataliefosterdoc",
    avatar_url: "https://i.pravatar.cc/150?u=nataliefoster"
  },
  {
    name: "James Wilson",
    bio: "Streaming platform tracker. James keeps tabs on what's leaving and arriving on Netflix, Hulu, Max, and Prime each month.",
    role: "Streaming Guide Editor",
    twitter_handle: "@jameswilsonstream",
    avatar_url: "https://i.pravatar.cc/150?u=jameswilson"
  }
];

export async function seedAuthors() {
  console.log('Seeding authors...');
  
  const data = AUTHORS.map((author, index) => {
    // Generate a pseudo-deterministic UUID based on index or name for idempotency
    const paddedIndex = String(index + 1).padStart(12, '0')
    const id = `00000000-0000-0000-0000-${paddedIndex}`
    return {
      id,
      name: author.name,
      bio: author.bio,
      avatar_url: author.avatar_url,
      social_links: { twitter: author.twitter_handle, role: author.role }
    }
  });

  const { error } = await supabase
    .from('authors')
    .upsert(data, { onConflict: 'id' });

  if (error) {
    console.error('Error seeding authors:', error);
    throw error;
  }
  
  console.log('Authors seeded successfully.');
}
