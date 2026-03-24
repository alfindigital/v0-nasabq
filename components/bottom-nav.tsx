'use client'

import { useEffect, useState } from 'react'
import { TreePine, List, Link2, Search, Plus } from 'lucide-react'
import type { ViewType } from '@/lib/types'
import { useNasabStore } from '@/lib/store'

interface BottomNavProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  onAddClick: () => void
}

export function BottomNav({ activeView, onViewChange, onAddClick }: BottomNavProps) {
  const [showPulse, setShowPulse] = useState(false)
  const members = useNasabStore((state) => state.members)

  // Show pulse animation on first launch (only self exists)
  useEffect(() => {
    if (members.length === 1) {
      setShowPulse(true)
      const timer = setTimeout(() => setShowPulse(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [members.length])

  const tabs = [
    { id: 'tree' as const, icon: TreePine, label: 'Pohon' },
    { id: 'list' as const, icon: List, label: 'Daftar' },
  ]

  const rightTabs = [
    { id: 'relationship' as const, icon: Link2, label: 'Hubungan' },
    { id: 'search' as const, icon: Search, label: 'Cari' },
  ]

  return (
    <nav className="h-14 bg-card border-t border-border flex items-center justify-around px-2 relative z-30">
      {/* Left tabs */}
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeView === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <tab.icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}

      {/* Center Add Button */}
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={onAddClick}
          className={`relative w-[46px] h-[46px] -mt-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary-hover active:scale-[0.93] transition-all ${showPulse ? 'add-pulse' : ''}`}
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* Right tabs */}
      {rightTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeView === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <tab.icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
