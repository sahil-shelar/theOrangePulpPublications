import { login } from '@/lib/actions/auth'
import Link from 'next/link'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const { error, message } = await searchParams;
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans">
      <Link href="/" className="font-heading text-2xl font-black uppercase tracking-widest text-foreground mb-8 text-center hover:text-primary transition-colors">
        &larr; The Orange Pulp
      </Link>
      
      <div className="w-full max-w-md brutal-card bg-primary p-8 md:p-12">
        <h1 className="font-heading text-4xl font-black uppercase tracking-tighter text-foreground mb-8 text-center">Login</h1>
        
        {error && (
          <div className="bg-red-500 text-white p-4 font-bold border-[3px] border-foreground text-xs uppercase tracking-widest mb-6">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-500 text-white p-4 font-bold border-[3px] border-foreground text-xs uppercase tracking-widest mb-6">
            {message}
          </div>
        )}

        <form action={login} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-foreground">Email Address</label>
            <input type="email" name="email" required className="bg-background border-[3px] border-foreground p-3 font-bold text-sm focus:ring-0 text-foreground" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-foreground">Password</label>
            <input type="password" name="password" required className="bg-background border-[3px] border-foreground p-3 font-bold text-sm focus:ring-0 text-foreground" />
          </div>
          
          <button type="submit" className="w-full bg-foreground text-background border-[3px] border-foreground px-4 py-4 text-sm font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-hard transition-all">
            Secure Login
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/forgot-password" className="text-label font-black uppercase tracking-widest text-foreground hover:underline">
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
}

