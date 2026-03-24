'use client'

export function Header() {
  return (
    <header className="h-12 md:h-[52px] px-4 flex items-center bg-primary/10 border-b border-primary/20 sticky top-0 z-40">
      {/* Logo & Title - aligned left */}
      <div className="flex items-center gap-2">
        {/* NasabQ Logo - Minimalist tree with roots symbolizing lineage */}
        <svg 
          viewBox="0 0 24 24" 
          className="w-6 h-6 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Tree trunk */}
          <line x1="12" y1="8" x2="12" y2="16" />
          {/* Branches (descendants) */}
          <line x1="12" y1="8" x2="7" y2="4" />
          <line x1="12" y1="8" x2="17" y2="4" />
          <line x1="12" y1="11" x2="8" y2="8" />
          <line x1="12" y1="11" x2="16" y2="8" />
          {/* Roots (ancestors) */}
          <line x1="12" y1="16" x2="8" y2="20" />
          <line x1="12" y1="16" x2="16" y2="20" />
        </svg>
        <h1 className="font-display font-extrabold text-xl tracking-[2px] text-primary select-none">
          NASABQ
        </h1>
      </div>
    </header>
  )
}
