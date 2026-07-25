import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { seedCategories } from '../seeders/categories'
import { seedTags } from '../seeders/tags'
import { seedAuthors } from '../seeders/authors'
import { seedMovies } from '../seeders/movies'
import { seedArticles } from '../seeders/articles'
import { seedUsers } from '../seeders/users'
import { seedComments } from '../seeders/comments'
import { seedBookmarks } from '../seeders/bookmarks'
import { seedAnalytics } from '../seeders/analytics'
import { seedNewsletter } from '../seeders/newsletter'
import { seedMedia } from '../seeders/media'

async function run() {
  const args = process.argv.slice(2)
  const seedAll = args.includes('--all') || args.length === 0

  console.log('🌱 Starting database seeding...')

  if (seedAll || args.includes('--categories')) {
    console.log('Seeding Categories...')
    await seedCategories()
  }
  
  if (seedAll || args.includes('--tags')) {
    console.log('Seeding Tags...')
    await seedTags()
  }

  if (seedAll || args.includes('--authors')) {
    console.log('Seeding Authors...')
    await seedAuthors()
  }

  if (seedAll || args.includes('--movies')) {
    console.log('Seeding Movies from TMDb...')
    await seedMovies()
  }

  if (seedAll || args.includes('--articles')) {
    console.log('Seeding Articles...')
    await seedArticles()
  }
  
  if (seedAll || args.includes('--users')) {
    console.log('Seeding Users...')
    await seedUsers()
  }

  if (seedAll || args.includes('--comments')) {
    console.log('Seeding Comments...')
    await seedComments()
  }

  if (seedAll || args.includes('--bookmarks')) {
    console.log('Seeding Bookmarks...')
    await seedBookmarks()
  }

  if (seedAll || args.includes('--analytics')) {
    console.log('Seeding Analytics...')
    await seedAnalytics()
  }

  if (seedAll || args.includes('--newsletter')) {
    console.log('Seeding Newsletter subscribers...')
    await seedNewsletter()
  }

  if (seedAll || args.includes('--media')) {
    console.log('Seeding Media library...')
    await seedMedia()
  }

  console.log('✅ Seeding completed!')
  process.exit(0)
}

run().catch(err => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
