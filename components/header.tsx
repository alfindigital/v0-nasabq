'use client'

export function Header() {
  return (
    <header className="h-12 md:h-[52px] px-4 flex items-center bg-primary/10 border-b border-primary/20 sticky top-0 z-40">
      {/* Logo & Title - aligned left */}
      <div className="flex items-center gap-2">
        {/* Tree Logo SVG */}
        <svg 
          viewBox="0 0 32 32" 
          className="w-7 h-7 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Tree trunk */}
          <path d="M16 28V18" />
          {/* Tree crown - layered circles */}
          <circle cx="16" cy="12" r="6" fill="currentColor" fillOpacity="0.15" />
          <circle cx="11" cy="14" r="4" fill="currentColor" fillOpacity="0.2" />
          <circle cx="21" cy="14" r="4" fill="currentColor" fillOpacity="0.2" />
          <circle cx="16" cy="8" r="4" fill="currentColor" fillOpacity="0.25" />
          {/* Roots */}
          <path d="M13 28C13 26 14 24 16 24C18 24 19 26 19 28" />
        </svg>
        <h1 className="font-display font-extrabold text-xl tracking-[2px] text-primary select-none">
          NASABQ
        </h1>
      </div>
    </header>
  )
}
