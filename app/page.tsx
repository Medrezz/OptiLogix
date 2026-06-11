'use client'

import { useState } from 'react'
import Image from 'next/image'
import AuraBackground from '@/components/AuraBackground'
import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  const [auraState, setAuraState] = useState<'idle' | 'thinking' | 'generating'>('idle')

  return (
    <main className="relative min-h-screen flex flex-col" style={{ zIndex: 1 }}>
      <AuraBackground state={auraState} />

      <div className="relative flex flex-col h-screen" style={{ zIndex: 2 }}>
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-black/40">
              <Image
                src="/logo.png"
                alt="OptiLogix"
                width={36}
                height={36}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">
                optilogix
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">X</span>
              </h1>
              <p className="text-[10px] text-white/30 leading-none mt-0.5">Multimodal AI Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                auraState === 'idle'
                  ? 'bg-emerald-400/70'
                  : auraState === 'thinking'
                  ? 'bg-violet-400 animate-pulse'
                  : 'bg-pink-400 animate-pulse'
              }`} />
              <span className="text-xs text-white/40 capitalize">
                {auraState === 'idle' ? 'Ready' : auraState === 'thinking' ? 'Processing...' : 'Creating...'}
              </span>
            </div>

            <div className="glass-panel rounded-lg px-3 py-1.5 text-xs text-white/40 hidden sm:block">
              Kimi K2 · DALL-E 3
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 p-4 sm:p-6">
          <div className="glass-panel rounded-2xl h-full p-4 sm:p-6 max-w-5xl mx-auto">
            <ChatInterface onAuraStateChange={setAuraState} />
          </div>
        </div>

        <footer className="flex-shrink-0 flex items-center justify-center gap-4 px-6 py-2 border-t border-white/5">
          <p className="text-[10px] text-white/20">
            OptiLogix © 2026 · optilogix.qiroxstudio.online
          </p>
        </footer>
      </div>
    </main>
  )
}
