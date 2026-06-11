'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'

const AuraBackground = dynamic(() => import('@/components/AuraBackground'), { ssr: false })
const ChatInterface  = dynamic(() => import('@/components/ChatInterface'), { ssr: false })

export default function WorkspacePage() {
  const { data: session } = useSession()
  const [auraState, setAuraState] = useState<'idle'|'thinking'|'generating'>('idle')

  return (
    <div className="relative h-screen flex flex-col bg-[#03030a] overflow-hidden">
      <AuraBackground state={auraState} />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 py-3 border-b border-white/5 glass flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/home">
            <Image src="/logo.png" alt="OptiLogix" width={32} height={32} className="rounded-xl" />
          </Link>
          <div>
            <div className="text-sm font-bold text-white leading-none">optilogix<span className="grad-text">X</span></div>
            <div className="text-[10px] text-white/30">Workspace</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
              auraState === 'idle' ? 'bg-emerald-400' : auraState === 'thinking' ? 'bg-violet-400 animate-pulse' : 'bg-pink-400 animate-pulse'
            }`} />
            <span className="text-xs text-white/40">{auraState === 'idle' ? 'Ready' : auraState === 'thinking' ? 'Thinking...' : 'Creating...'}</span>
          </div>

          {session ? (
            <div className="flex items-center gap-2">
              <div className="coin-badge">🪙 {session.user.coinBalance ?? 0}</div>
              <Link href="/dashboard" className="glass px-3 py-1.5 rounded-xl text-xs text-white/60 hover:text-white transition-all">
                Dashboard
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30 hidden sm:block">Free tier active</span>
              <Link href="/auth" className="grad-btn px-3 py-1.5 rounded-xl text-xs text-white font-medium">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Chat */}
      <div className="relative z-10 flex-1 min-h-0 p-4">
        <div className="glass rounded-2xl h-full max-w-5xl mx-auto p-4">
          <ChatInterface
            onAuraStateChange={setAuraState}
            session={session}
          />
        </div>
      </div>
    </div>
  )
}
