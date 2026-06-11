'use client'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { api } from '@/lib/api'

const MENU = [
  { href:'/dashboard',           icon:'🏠', label:'Overview',   active:true },
  { href:'/workspace',           icon:'🧠', label:'Workspace',  active:false },
  { href:'/dashboard/developer', icon:'⚡', label:'Developer',  active:false },
]

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [balance, setBalance] = useState<{ balance: number; free_images_remaining: number } | null>(null)
  const [history, setHistory] = useState<unknown[]>([])
  const [packages, setPackages] = useState<{ id: string; label: string; coins: number; price_sar: number }[]>([])
  const [buying, setBuying] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth')
  }, [status, router])

  useEffect(() => {
    if (!session?.backendToken) return
    api.coins.balance(session.backendToken).then(d => { if(d.success) setBalance(d) }).catch(()=>{})
    api.coins.history(session.backendToken).then(d => { if(d.success) setHistory(d.history) }).catch(()=>{})
    api.coins.packages().then(d => { if(d.success) setPackages(d.packages) }).catch(()=>{})
  }, [session])

  if (status === 'loading' || !session) {
    return <div className="h-screen flex items-center justify-center bg-[#03030a]"><div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" /></div>
  }

  const handleBuy = async (pkgId: string) => {
    if (!session.backendToken) return
    setBuying(pkgId)
    const res = await api.coins.createPurchase(session.backendToken, { package_id: pkgId })
    if (res.success) {
      alert(`PayPal amount: $${res.paypal_amount} USD\n\nPayPal integration coming soon. Contact support to purchase coins.`)
    }
    setBuying(null)
  }

  return (
    <div className="min-h-screen bg-[#03030a] flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-white/5 p-4 glass">
        <Link href="/home" className="flex items-center gap-2.5 mb-8 px-2">
          <Image src="/logo.png" alt="OptiLogix" width={32} height={32} className="rounded-xl" />
          <span className="font-bold text-white">optilogix<span className="grad-text">X</span></span>
        </Link>

        <nav className="flex-1 space-y-1">
          {MENU.map(m => (
            <Link key={m.href} href={m.href} className={`sidebar-item ${m.active ? 'active' : ''}`}>
              <span>{m.icon}</span><span>{m.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="glass rounded-xl p-3 mb-3">
            <div className="text-xs text-white/40 mb-1">Coin Balance</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              <span className="text-xl font-bold text-white">{balance?.balance ?? session.user.coinBalance ?? 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-300">
              {session.user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white/80 truncate">{session.user.name || 'User'}</div>
              <div className="text-xs text-white/30 truncate">{session.user.phone || session.user.email || ''}</div>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/home' })} className="text-white/30 hover:text-red-400 transition-colors" title="Sign out">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back, {session.user.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="text-white/40 mb-8">Here's your OptiLogix overview.</p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Coin Balance', value: balance?.balance ?? 0, icon: '🪙', color: 'text-amber-400' },
              { label: 'Free Images Left', value: balance?.free_images_remaining ?? 0, icon: '🎨', color: 'text-blue-400' },
              { label: 'Chat Messages', value: '∞', icon: '💬', color: 'text-emerald-400' },
              { label: 'Your Role', value: session.user.role || 'client', icon: '👤', color: 'text-violet-400' },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl p-5">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className={`text-2xl font-bold capitalize ${s.color}`}>{String(s.value)}</div>
                <div className="text-xs text-white/40 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Buy Coins */}
          <div className="glass-strong rounded-3xl p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-1">Buy Coins</h2>
            <p className="text-sm text-white/40 mb-5">Power up your workspace. Chat is always free.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map(pkg => (
                <div key={pkg.id} className="glass rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🪙</span>
                    <span className="text-xl font-bold grad-text">{pkg.coins.toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-white/60 mb-4">{pkg.label} Package</div>
                  <div className="mt-auto">
                    <div className="text-2xl font-bold text-white mb-3">{pkg.price_sar} SAR</div>
                    <button onClick={() => handleBuy(pkg.id)} disabled={!!buying}
                      className="w-full grad-btn py-2 rounded-xl text-sm text-white font-medium disabled:opacity-50">
                      {buying === pkg.id ? 'Processing...' : 'Buy with PayPal'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction history */}
          <div className="glass rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-5">Transaction History</h2>
            {history.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-8">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {(history as { id: number; type: string; description: string; coins: number; amount_sar: number; status: string; created_at: string }[]).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div>
                      <div className="text-sm text-white/80">{tx.description}</div>
                      <div className="text-xs text-white/30">{new Date(tx.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-amber-400">+{tx.coins} 🪙</div>
                      <div className={`text-xs ${tx.status === 'completed' ? 'text-emerald-400' : 'text-yellow-400'}`}>{tx.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
