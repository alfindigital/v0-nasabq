'use client'

import { Menu } from 'lucide-react'

interface HeaderProps {
  onMenuOpen: () => void
}

export function Header({ onMenuOpen }: HeaderProps) {
  return (
    <header className="h-12 md:h-[52px] px-4 flex items-center justify-between bg-card/95 backdrop-blur-xl border-b border-border sticky top-0 z-40">
      {/* Logo */}
      <h1 className="font-display font-extrabold text-xl tracking-[3px] text-primary select-none">
        NASAB
      </h1>

      {/* Menu Button */}
      <button
        onClick={onMenuOpen}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted active:scale-95 transition-all"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>
    </header>
  )
}
