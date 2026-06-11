'use client'

import { useRef, useState } from 'react'

interface VisionUploadProps {
  onImageSelect: (base64: string, preview: string) => void
  selectedImage: string | null
  onClear: () => void
}

export default function VisionUpload({ onImageSelect, selectedImage, onClear }: VisionUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      onImageSelect(base64, base64)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  if (selectedImage) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-violet-400/30">
        <img src={selectedImage} alt="Selected" className="w-full max-h-64 object-contain bg-black/40" />
        <button
          onClick={onClear}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <p className="text-xs text-white/60">Image ready for analysis</p>
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all flex flex-col items-center gap-3 ${
        dragging
          ? 'border-violet-400/70 bg-violet-500/10'
          : 'border-white/15 hover:border-white/30 hover:bg-white/5'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processFile(file)
        }}
      />
      <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-400/20 flex items-center justify-center">
        <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm text-white/70 font-medium">Drop an image here</p>
        <p className="text-xs text-white/40 mt-1">or click to browse · PNG, JPG, WebP</p>
      </div>
    </div>
  )
}
