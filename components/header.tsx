'use client'

export function Header() {
  return (
    <header className="h-12 md:h-[52px] px-4 flex items-center bg-primary/10 border-b border-primary/20 sticky top-0 z-40">
      {/* Logo & Title - aligned left */}
      <div className="flex items-center gap-2">
        {/* Simple Tree Logo SVG */}
        <svg 
          viewBox="0 0 24 24" 
          className="w-6 h-6 text-primary"
          fill="currentColor"
        >
          {/* Simple tree silhouette */}
          <path d="M12 2L8 8h2v3H7l-3 6h4v5h8v-5h4l-3-6h-3V8h2L12 2z" />
        </svg>
        <h1 className="font-display font-extrabold text-xl tracking-[2px] text-primary select-none">
          NASABQ
        </h1>
      </div>
    </header>
  )
}
