'use client'

import { useState } from 'react'

interface GeneratedImage {
  url: string
  prompt: string
  timestamp: number
}

interface ImageGalleryProps {
  images: GeneratedImage[]
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [selected, setSelected] = useState<GeneratedImage | null>(null)

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/30 gap-3">
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">Your generated images will appear here</p>
        <p className="text-xs opacity-60">Try: "Draw a futuristic city at sunset"</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 p-1 overflow-y-auto">
        {images.map((img) => (
          <button
            key={img.timestamp}
            onClick={() => setSelected(img)}
            className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-violet-400/40 transition-all aspect-square"
          >
            <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <p className="text-xs text-white/80 line-clamp-2">{img.prompt}</p>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="glass-panel rounded-2xl p-4 max-w-2xl w-full animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={selected.url} alt={selected.prompt} className="w-full rounded-xl object-contain max-h-[70vh]" />
            <div className="mt-3 flex items-start justify-between gap-3">
              <p className="text-sm text-white/60">{selected.prompt}</p>
              <button
                onClick={() => setSelected(null)}
                className="flex-shrink-0 text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
