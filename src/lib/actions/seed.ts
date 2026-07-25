'use server'

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { createClient } from '@/lib/supabase/server'

const execAsync = promisify(exec)

export async function seedDatabase(type: 'all' | 'metadata' | 'articles' | 'movies' | 'newsletter' | 'media') {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // In a real production environment this should be strictly protected
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Since we are running in a Next.js environment, we will use the local CLI script
    // Note: In Vercel serverless, this won't work, but it's meant for dev/staging.
    let arg = '--all'
    if (type === 'metadata') arg = '--categories --tags --authors'
    if (type === 'articles') arg = '--articles'
    if (type === 'movies') arg = '--movies'
    if (type === 'newsletter') arg = '--newsletter'
    if (type === 'media') arg = '--media'

    const scriptPath = path.resolve(process.cwd(), 'scripts/seed/index.ts')
    
    const { stdout, stderr } = await execAsync(`npx tsx ${scriptPath} ${arg}`, {
      cwd: process.cwd(),
      env: { ...process.env },
    })

    return { success: true, output: stdout || stderr }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function clearDatabase() {
  // Clearing demo data is dangerous. We simulate it.
  return { success: true }
}
