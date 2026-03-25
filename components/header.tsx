'use client'

import { Moon, Sun } from 'lucide-react'
import { NasabLogo } from './nasab-logo'

interface HeaderProps {
  darkMode: boolean
  onToggleDarkMode: () => void
}

export function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
  return (
    <header className="h-14 md:h-[56px] px-4 flex items-center justify-between bg-primary/10 border-b border-primary/20 sticky top-0 z-40">
      {/* Logo & Title with Tagline - aligned left */}
      <div className="flex flex-col">
        <NasabLogo size="sm" showText textSize="sm" />
        <p className="text-[10px] text-muted-foreground -mt-0.5">Kenali Akar Keluargamu</p>
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
