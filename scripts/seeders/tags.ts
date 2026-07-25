import { supabase } from '../seed/config';
import { generateSlug } from '../seed/helpers';

const TAGS = [
  // Genres
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy",
  "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "Sci-Fi", "Thriller", "War", "Western",
  "Dark Comedy", "Romantic Comedy", "Action Thriller", "Psychological Thriller", "Biographical", "Cyberpunk",
  "Steampunk", "Post-Apocalyptic", "Zombie", "Vampire", "Superhero", "Martial Arts", "Spy", "Heist",
  "Coming-of-Age", "Teen", "Musical", "Neo-Noir", "Slapstick", "Space Opera", "Survival", "Urban Fantasy",

  // Studios
  "Warner Bros", "Universal Pictures", "Paramount Pictures", "20th Century Studios", "Sony Pictures",
  "Walt Disney Pictures", "Marvel Studios", "DC Films", "Lucasfilm", "Pixar", "DreamWorks Animation",
  "Studio Ghibli", "A24", "Neon", "Lionsgate", "MGM", "New Line Cinema", "Searchlight Pictures",
  "Focus Features", "Legendary Pictures", "Illumination", "Blue Sky Studios", "Bad Robot", "Blumhouse",
  "Plan B Entertainment", "Annapurna Pictures", "Amblin Entertainment", "Miramax", "Screen Gems", "Toho",
  "Toei Animation", "Kyoto Animation", "Bones", "MAPPA", "Madhouse", "Ufotable", "Wit Studio", "CloverWorks",
  "Sunrise", "Production I.G", "Trigger", "A-1 Pictures", "JCStaff", "Pierrot", "Tatsunoko", "TMS Entertainment",

  // Actors (a subset)
  "Tom Cruise", "Leonardo DiCaprio", "Brad Pitt", "Denzel Washington", "Tom Hanks", "Robert De Niro", "Al Pacino",
  "Morgan Freeman", "Christian Bale", "Johnny Depp", "Will Smith", "Keanu Reeves", "Harrison Ford", "Samuel L. Jackson",
  "Matt Damon", "Hugh Jackman", "Ryan Reynolds", "Chris Hemsworth", "Chris Evans", "Robert Downey Jr.", "Mark Ruffalo",
  "Scarlett Johansson", "Natalie Portman", "Emma Stone", "Jennifer Lawrence", "Angelina Jolie", "Charlize Theron",
  "Cate Blanchett", "Meryl Streep", "Kate Winslet", "Anne Hathaway", "Margot Robbie", "Florence Pugh", "Zendaya",
  "Anya Taylor-Joy", "Viola Davis", "Halle Berry", "Nicole Kidman", "Julia Roberts", "Sandra Bullock", "Ryan Gosling",
  "Timothée Chalamet", "Tom Holland", "Cillian Murphy", "Joaquin Phoenix", "Daniel Day-Lewis", "Anthony Hopkins",
  "Gary Oldman", "Javier Bardem", "Christoph Waltz", "Mads Mikkelsen", "Idris Elba", "Tom Hardy", "Michael Fassbender",
  "Oscar Isaac", "Adam Driver", "Pedro Pascal", "Mahershala Ali", "Dwayne Johnson", "Jason Momoa", "Henry Cavill",
  "Ben Affleck", "Gal Gadot", "Jason Statham", "Vin Diesel", "Michelle Yeoh", "Jackie Chan", "Jet Li", "Bruce Lee",
  "Ke Huy Quan", "Steven Yeun", "Daniel Kaluuya", "John Boyega", "Rami Malek", "Andrew Garfield", "Emma Watson",
  "Daniel Radcliffe", "Rupert Grint", "Elijah Wood", "Ian McKellen", "Patrick Stewart", "Gillian Anderson", "David Duchovny",
  "Bryan Cranston", "Aaron Paul", "Bob Odenkirk", "Giancarlo Esposito", "James Gandolfini", "Peter Dinklage",
  "Emilia Clarke", "Kit Harington", "Lena Headey", "Sophie Turner", "Maisie Williams", "Nikolaj Coster-Waldau",

  // Directors
  "Steven Spielberg", "Martin Scorsese", "Christopher Nolan", "Quentin Tarantino", "David Fincher", "Stanley Kubrick",
  "Alfred Hitchcock", "Francis Ford Coppola", "Ridley Scott", "James Cameron", "Peter Jackson", "George Lucas",
  "Denis Villeneuve", "Bong Joon-ho", "Guillermo del Toro", "Alfonso Cuarón", "Alejandro G. Iñárritu", "Paul Thomas Anderson",
  "Wes Anderson", "Coen Brothers", "Greta Gerwig", "Kathryn Bigelow", "Sofia Coppola", "Jane Campion", "Chloe Zhao",
  "Patty Jenkins", "Hayao Miyazaki", "Satoshi Kon", "Makoto Shinkai", "Mamoru Hosoda", "Hideaki Anno", "Wong Kar-wai",
  "Akira Kurosawa", "Park Chan-wook", "Edgar Wright", "Taika Waititi", "James Gunn", "Zack Snyder", "J.J. Abrams",
  "Rian Johnson", "Jordan Peele", "Ari Aster", "Robert Eggers", "Damien Chazelle", "Richard Linklater", "Spike Lee",
  "Michael Mann", "Brian De Palma", "John Carpenter", "David Lynch", "Darren Aronofsky", "Sam Mendes", "Todd Phillips",
  "Matt Reeves", "Gareth Edwards", "Jon Favreau", "Joe Russo", "Anthony Russo", "Ryan Coogler", "Sam Raimi", "Tim Burton",
  "Ang Lee", "Peter Weir", "Michael Bay", "Roland Emmerich", "Luc Besson", "Guy Ritchie", "Matthew Vaughn",

  // Streaming Services
  "Netflix", "Amazon Prime Video", "Disney+", "Hulu", "Max", "HBO Max", "Apple TV+", "Peacock", "Paramount+",
  "Crunchyroll", "Funimation", "HIDIVE", "Tubi", "Pluto TV", "Shudder", "Mubi", "Criterion Channel", "Vudu",
  "Freevee", "Roku Channel", "YouTube Premium", "BBC iPlayer", "Hotstar", "SonyLIV", "Zee5", "JioCinema",

  // Awards
  "Oscars", "Academy Awards", "Golden Globes", "BAFTA", "Emmys", "Primetime Emmys", "Grammys", "Tony Awards",
  "SAG Awards", "Directors Guild Awards", "Producers Guild Awards", "Writers Guild Awards", "Critics Choice",
  "Cannes Film Festival", "Palme d'Or", "Venice Film Festival", "Golden Lion", "Berlin Film Festival", "Golden Bear",
  "Sundance Film Festival", "TIFF", "Toronto International Film Festival", "SXSW", "Annie Awards", "Saturn Awards",
  "Hugo Awards", "Nebula Awards", "Peabody Awards", "MTV Movie Awards", "Kids Choice Awards", "People's Choice Awards",

  // Franchises
  "Star Wars", "Marvel Cinematic Universe", "MCU", "DC Extended Universe", "DCEU", "Harry Potter", "Wizarding World",
  "Lord of the Rings", "Middle-earth", "James Bond", "007", "Fast & Furious", "Jurassic Park", "Jurassic World",
  "Batman", "Superman", "Spider-Man", "X-Men", "Avengers", "Transformers", "Pirates of the Caribbean", "Mission: Impossible",
  "The Hunger Games", "Twilight", "Indiana Jones", "Matrix", "Terminator", "Alien", "Predator", "Godzilla", "King Kong",
  "MonsterVerse", "Star Trek", "Doctor Who", "Ghostbusters", "Rocky", "Creed", "Die Hard", "Lethal Weapon",
  "John Wick", "Bourne", "Toy Story", "Despicable Me", "Minions", "Shrek", "Ice Age", "Madagascar", "Kung Fu Panda",
  "How to Train Your Dragon", "Frozen", "The Lion King", "Dune", "Avatar", "Mad Max", "Planet of the Apes",
  "Game of Thrones", "House of the Dragon", "Breaking Bad", "Better Call Saul", "The Walking Dead", "Stranger Things",
  "The Boys", "The Witcher", "Cyberpunk 2077", "Fallout", "The Last of Us", "Halo", "Resident Evil", "Tomb Raider",
  "Sonic the Hedgehog", "Super Mario Bros", "Pokemon", "Dragon Ball", "Naruto", "One Piece", "Bleach",
  "My Hero Academia", "Attack on Titan", "Demon Slayer", "Jujutsu Kaisen", "Chainsaw Man", "Spy x Family",

  // Miscellaneous Concepts / Tropes
  "Time Travel", "Artificial Intelligence", "Virtual Reality", "Aliens", "Dinosaurs", "Monsters", "Magic", "Witches",
  "Wizards", "Dragons", "Elves", "Dwarves", "Orcs", "Goblins", "Ghosts", "Demons", "Angels", "Heaven", "Hell",
  "Space Exploration", "First Contact", "Multiverse", "Parallel Universe", "Alternate History", "Dystopia", "Utopia",
  "Apocalypse", "Pandemic", "Virus", "Contagion", "Serial Killer", "Assassin", "Bounty Hunter", "Mercenary",
  "Detective", "Police", "Lawyer", "Doctor", "Hospital", "School", "High School", "College", "University",
  "Sports", "Football", "Basketball", "Baseball", "Soccer", "Boxing", "MMA", "Wrestling", "Racing", "Cars",
  "Planes", "Trains", "Ships", "Submarines", "Island", "Desert", "Jungle", "Forest", "Mountain", "Snow", "Ice"
];

export async function seedTags() {
  console.log('Seeding tags...');
  
  const BATCH_SIZE = 100;
  for (let i = 0; i < TAGS.length; i += BATCH_SIZE) {
    const batch = TAGS.slice(i, i + BATCH_SIZE);
    const data = batch.map((name) => ({
      name,
      slug: generateSlug(name)
    }));

    const { error } = await supabase
      .from('tags')
      .upsert(data, { onConflict: 'slug' });

    if (error) {
      console.error('Error seeding tags batch:', error);
      throw error;
    }
  }

  console.log('Tags seeded successfully.');
}
