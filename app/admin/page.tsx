'use client'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { api } from '@/lib/api'

type User = { id: number; name: string; phone: string; email: string; role: string; coin_balance: number; is_active: number; created_at: string }
type Stats = { total_users: number; total_revenue_sar: number; total_coins_sold: number; new_users_today: number; total_image_generations: number; total_chat_requests: number; total_api_keys: number }

const NAV = [
  { href:'/admin', icon:'📊', label:'Overview', active:true },
  { href:'/admin/god', icon:'👑', label:'God Mode', active:false },
  { href:'/dashboard', icon:'🏠', label:'My Dashboard', active:false },
]

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'overview'|'users'|'transactions'>('overview')
  const [transactions, setTransactions] = useState<unknown[]>([])
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth'); return }
    if (status === 'authenticated' && !['admin','god'].includes(session?.user?.role || '')) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const loadData = useCallback(async () => {
    if (!session?.backendToken) return
    const [s, u, t] = await Promise.all([
      api.admin.stats(session.backendToken),
      api.admin.users(session.backendToken, page, search),
      api.admin.transactions(session.backendToken),
    ])
    if (s.success) setStats(s)
    if (u.success) { setUsers(u.users); setTotal(u.total) }
    if (t.success) setTransactions(t.transactions)
  }, [session, page, search])

  useEffect(() => { loadData() }, [loadData])

  const doUserAction = async (userId: number, action: string, extra: Record<string, unknown> = {}) => {
    if (!session?.backendToken) return
    setActionLoading(userId)
    await api.admin.manageUser(session.backendToken, { user_id: userId, action, ...extra })
    await loadData()
    setActionLoading(null)
  }

  if (status === 'loading' || !session) return <div className="h-screen flex items-center justify-center bg-[#03030a]"><div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" /></div>

  const STAT_CARDS = [
    { label:'Total Users',       value: stats?.total_users ?? 0,                icon:'👥', color:'text-blue-400' },
    { label:'New Today',         value: stats?.new_users_today ?? 0,            icon:'✨', color:'text-emerald-400' },
    { label:'Revenue (SAR)',     value: `${Number(stats?.total_revenue_sar ?? 0).toFixed(0)} ﷼`, icon:'💰', color:'text-amber-400' },
    { label:'Coins Sold',        value: stats?.total_coins_sold ?? 0,           icon:'🪙', color:'text-amber-300' },
    { label:'Image Generations', value: stats?.total_image_generations ?? 0,   icon:'🎨', color:'text-pink-400' },
    { label:'Chat Requests',     value: stats?.total_chat_requests ?? 0,       icon:'💬', color:'text-violet-400' },
    { label:'Active API Keys',   value: stats?.total_api_keys ?? 0,             icon:'🔑', color:'text-cyan-400' },
  ]

  return (
    <div className="min-h-screen bg-[#03030a] flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-white/5 p-4 glass flex flex-col">
        <Link href="/home" className="flex items-center gap-2.5 mb-6 px-2">
          <Image src="/logo.png" alt="OptiLogix" width={32} height={32} className="rounded-xl" />
          <div>
            <div className="font-bold text-white text-sm">optilogix<span className="grad-text">X</span></div>
            <div className="text-[10px] text-amber-400">Admin Panel</div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className={`sidebar-item ${n.active ? 'active' : ''}`}>
              <span>{n.icon}</span><span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2 px-2">
          <div className="flex-1 text-sm text-white/50">{session.user.name}</div>
          <button onClick={() => signOut({ callbackUrl: '/home' })} className="text-white/30 hover:text-red-400 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/40 mb-8">Platform overview and user management.</p>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            {(['overview','users','transactions'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${tab === t ? 'grad-btn text-white' : 'glass text-white/50 hover:text-white'}`}>{t}</button>
            ))}
          </div>

          {/* Overview */}
          {tab === 'overview' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STAT_CARDS.map(s => (
                <div key={s.label} className="glass rounded-2xl p-5">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className={`text-2xl font-bold ${s.color}`}>{String(s.value)}</div>
                  <div className="text-xs text-white/40 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div>
              <div className="flex gap-3 mb-6">
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search by name, phone or email..."
                  className="glass-input flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30" />
              </div>
              <div className="glass-strong rounded-3xl overflow-hidden">
                <div className="grid grid-cols-6 px-6 py-3 text-xs text-white/40 font-medium bg-white/5">
                  <div className="col-span-2">User</div>
                  <div>Role</div>
                  <div>Coins</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
                {users.map(u => (
                  <div key={u.id} className="grid grid-cols-6 px-6 py-4 border-t border-white/5 items-center">
                    <div className="col-span-2">
                      <div className="text-sm text-white/80">{u.name || '—'}</div>
                      <div className="text-xs text-white/30">{u.phone || u.email || '—'}</div>
                    </div>
                    <div className={`text-xs font-medium capitalize ${u.role === 'god' ? 'text-amber-400' : u.role === 'admin' ? 'text-violet-400' : 'text-white/50'}`}>{u.role}</div>
                    <div className="text-sm text-amber-400">🪙 {u.coin_balance}</div>
                    <div className={`text-xs ${u.is_active ? 'text-emerald-400' : 'text-red-400'}`}>{u.is_active ? 'Active' : 'Banned'}</div>
                    <div className="flex gap-2">
                      <button onClick={() => doUserAction(u.id, 'toggle_active')} disabled={actionLoading === u.id}
                        className="text-xs text-white/30 hover:text-white transition-colors" title={u.is_active ? 'Ban' : 'Unban'}>
                        {u.is_active ? '🚫' : '✅'}
                      </button>
                      <button onClick={() => { const c = prompt('Add coins:'); if(c) doUserAction(u.id,'add_coins',{coins:parseInt(c)}) }}
                        className="text-xs text-white/30 hover:text-amber-400 transition-colors" title="Add coins">🪙</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 text-sm text-white/40">
                <span>{total} total users</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="glass px-3 py-1 rounded-lg disabled:opacity-30">←</button>
                  <span className="px-3 py-1">Page {page}</span>
                  <button disabled={page * 20 >= total} onClick={() => setPage(p => p+1)} className="glass px-3 py-1 rounded-lg disabled:opacity-30">→</button>
                </div>
              </div>
            </div>
          )}

          {/* Transactions */}
          {tab === 'transactions' && (
            <div className="glass-strong rounded-3xl overflow-hidden">
              <div className="grid grid-cols-5 px-6 py-3 text-xs text-white/40 font-medium bg-white/5">
                <div>User</div><div>Type</div><div>Coins</div><div>Amount</div><div>Date</div>
              </div>
              {(transactions as { id: number; name: string; phone: string; type: string; coins: number; amount_sar: number; status: string; created_at: string }[]).map(tx => (
                <div key={tx.id} className="grid grid-cols-5 px-6 py-4 border-t border-white/5 items-center text-sm">
                  <div className="text-white/70">{tx.name || tx.phone || '—'}</div>
                  <div className="text-white/50 capitalize">{tx.type}</div>
                  <div className="text-amber-400">+{tx.coins} 🪙</div>
                  <div className={tx.status === 'completed' ? 'text-emerald-400' : 'text-yellow-400'}>{tx.amount_sar} SAR</div>
                  <div className="text-white/30 text-xs">{new Date(tx.created_at).toLocaleDateString()}</div>
                </div>
              ))}
              {transactions.length === 0 && <div className="px-6 py-8 text-center text-white/30">No transactions yet.</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
