'use client'
import { useState, useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function AuthForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { data: session } = useSession()
  const [tab, setTab] = useState<'login'|'register'>(params.get('tab') === 'register' ? 'register' : 'login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  useEffect(() => { if (session) router.push('/dashboard') }, [session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const res = await signIn('credentials', {
      phone, password, action: tab,
      ...(tab === 'register' ? { name } : {}),
      redirect: false,
    })
    setLoading(false)
    if (res?.error) setError(res.error)
    else router.push('/dashboard')
  }

  const handleGoogle = () => signIn('google', { callbackUrl: '/dashboard' })
  const handleApple  = () => signIn('apple',  { callbackUrl: '/dashboard' })

  return (
    <div className="min-h-screen flex bg-[#03030a]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-0" style={{background:'radial-gradient(circle at 30% 50%, rgba(124,58,237,0.18) 0%, transparent 60%)'}} />
        <div className="relative z-10 text-center">
          <Image src="/logo.png" alt="OptiLogix" width={96} height={96} className="mx-auto rounded-3xl mb-8 animate-float" />
          <h2 className="text-4xl font-bold text-white mb-4">Welcome to<br /><span className="grad-text">OptiLogix</span></h2>
          <p className="text-white/40 max-w-xs">The most powerful multimodal AI workspace. Chat free, generate images, build with our API.</p>

          <div className="mt-12 space-y-4 text-left">
            {[
              ['🧠', 'Unlimited free chat with Kimi K2'],
              ['🎨', '3 free image generations'],
              ['🔑', 'Developer API access'],
              ['🪙', 'Coins from 5 SAR only'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
                <span className="text-xl">{icon}</span>
                <span className="text-sm text-white/60">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <Image src="/logo.png" alt="OptiLogix" width={36} height={36} className="rounded-xl" />
            <span className="font-bold text-white text-xl">optilogix<span className="grad-text">X</span></span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            {tab === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-white/40 mb-8">
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError('') }} className="text-violet-400 hover:text-violet-300 underline">
              {tab === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 glass rounded-xl py-3 text-sm text-white/80 hover:text-white hover:border-white/20 transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <button onClick={handleApple} className="w-full flex items-center justify-center gap-3 glass rounded-xl py-3 text-sm text-white/80 hover:text-white hover:border-white/20 transition-all">
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              Continue with Apple
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">or with phone</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Phone form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-sm text-white/50 mb-2">Full Name</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="glass-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-white/50 mb-2">Phone Number</label>
              <input
                value={phone} onChange={e => setPhone(e.target.value)} required
                placeholder="+966 5xx xxx xxxx"
                className="glass-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="At least 6 characters"
                  className="glass-input w-full rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-white/25"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div className="glass rounded-xl px-4 py-3 text-sm text-red-300 border-red-400/20">
                ⚠ {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="grad-btn w-full py-3 rounded-xl text-white font-semibold text-sm mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {tab === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-white/20 mt-8">
            By continuing, you agree to our{' '}
            <a href="#" className="text-violet-400 hover:underline">Terms</a> and{' '}
            <a href="#" className="text-violet-400 hover:underline">Privacy Policy</a>
          </p>

          <div className="text-center mt-4">
            <Link href="/workspace" className="text-xs text-white/30 hover:text-white/50 transition-colors">
              Skip → Use workspace without account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
