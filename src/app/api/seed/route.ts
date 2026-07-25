import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import util from 'util'
import { createClient } from '@/lib/supabase/server'

const execAsync = util.promisify(exec)

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { command } = await req.json()
    
    // Security check: Only allow specific commands
    const allowedCommands = ['--all', '--categories', '--tags', '--authors', '--movies', '--articles', '--users', '--comments', '--bookmarks', '--analytics', '--newsletter', '--media']
    if (!allowedCommands.includes(command)) {
      return NextResponse.json({ error: 'Invalid command' }, { status: 400 })
    }

    // Since this is a long-running process, we'll kick it off.
    // In a real production app, you'd use a background worker queue for this.
    const { stdout, stderr } = await execAsync(`npm run seed ${command}`)

    return NextResponse.json({ message: stdout || stderr })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
