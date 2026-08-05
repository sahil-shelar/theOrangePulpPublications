import { resetPassword } from '@/lib/actions/auth'
import Link from 'next/link'

export default function ForgotPasswordPage({ searchParams }: { searchParams: { error?: string, message?: string } }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans">
      <Link href="/login" className="font-heading text-2xl font-black uppercase tracking-widest text-foreground mb-8 text-center hover:text-primary transition-colors">
        &larr; Back to Login
      </Link>
      
      <div className="w-full max-w-md brutal-card bg-secondary p-8 md:p-12">
        <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-foreground mb-4 text-center">Recover Access</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-foreground/80 text-center mb-8">Enter your editorial email address</p>
        
        {searchParams.error && (
          <div className="bg-red-500 text-white p-4 font-bold border-[3px] border-foreground text-xs uppercase tracking-widest mb-6">
            {searchParams.error}
          </div>
        )}

        {searchParams.message && (
          <div className="bg-foreground text-background p-4 font-bold border-[3px] border-foreground text-xs uppercase tracking-widest mb-6">
            {searchParams.message}
          </div>
        )}

        <form action={resetPassword} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-foreground">Email Address</label>
            <input type="email" name="email" required className="bg-background border-[3px] border-foreground p-3 font-bold text-sm focus:ring-0 text-foreground" />
          </div>
          
          <button type="submit" className="w-full bg-foreground text-background border-[3px] border-foreground px-4 py-4 text-sm font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-hard transition-all">
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  )
}
