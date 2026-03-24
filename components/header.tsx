'use client'

export function Header() {
  return (
    <header className="h-12 md:h-[52px] px-4 flex items-center justify-center bg-primary/10 border-b border-primary/20 sticky top-0 z-40">
      {/* Logo */}
      <h1 className="font-display font-extrabold text-xl tracking-[3px] text-primary select-none">
        NASAB
      </h1>
    </header>
  )
}
