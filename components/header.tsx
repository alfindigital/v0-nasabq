'use client'

import { Moon, Sun } from 'lucide-react'

interface HeaderProps {
  darkMode: boolean
  onToggleDarkMode: () => void
}

export function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
  return (
    <header className="h-12 md:h-[52px] px-4 flex items-center justify-between bg-primary/10 border-b border-primary/20 sticky top-0 z-40">
      {/* Logo & Title - aligned left */}
      <div className="flex items-center gap-2">
        {/* NasabQ Logo - Simplified tree symbolizing lineage */}
        <svg 
          viewBox="0 0 24 24" 
          className="w-6 h-6 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Trunk */}
          <line x1="12" y1="6" x2="12" y2="18" />
          {/* Top branches */}
          <line x1="12" y1="6" x2="6" y2="3" />
          <line x1="12" y1="6" x2="18" y2="3" />
          {/* Bottom roots */}
          <line x1="12" y1="18" x2="7" y2="21" />
          <line x1="12" y1="18" x2="17" y2="21" />
        </svg>
        <h1 className="font-display font-extrabold text-xl tracking-[2px] text-primary select-none">
          NASABQ
        </h1>
      </div>

      {/* Dark Mode Toggle - aligned right */}
      <button
        onClick={onToggleDarkMode}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-primary/10 active:bg-primary/20 transition-all duration-200"
        aria-label={darkMode ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      >
        <div className="relative w-5 h-5">
          <Sun className={`absolute inset-0 w-5 h-5 text-primary transition-all duration-300 ${darkMode ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
          <Moon className={`absolute inset-0 w-5 h-5 text-primary transition-all duration-300 ${darkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
        </div>
      </button>
    </header>
  )
}
