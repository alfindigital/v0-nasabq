'use client'

import { useState, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Minimize2, Expand, Search, X, User } from 'lucide-react'
import type { Member } from '@/lib/types'

interface ZoomControlsProps {
  onFit: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onToggleAll?: () => void
  isAllExpanded?: boolean
  members?: Member[]
  onSelectMember?: (member: Member) => void
}

export function ZoomControls({ 
  onZoomIn, 
  onZoomOut, 
  onReset, 
  onToggleAll, 
  isAllExpanded,
  members = [],
  onSelectMember 
}: ZoomControlsProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredMembers = searchQuery.trim()
    ? members.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.nickname && m.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : []

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
      }
      if (e.key === '/' && !searchOpen) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen])

  const buttons = [
    { icon: ZoomIn, label: 'Zoom in', onClick: onZoomIn },
    { icon: ZoomOut, label: 'Zoom out', onClick: onZoomOut },
    { icon: RotateCcw, label: 'Reset view', onClick: onReset },
  ]

  return (
    <>
      {/* Control buttons - right side */}
      <div className="zoom-controls fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
        {/* Search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="w-9 h-9 md:w-10 md:h-10 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:border-primary hover:text-primary active:scale-95 transition-all opacity-70 hover:opacity-100"
          title="Cari anggota (tekan /)"
        >
          <Search className="w-4 h-4" />
        </button>

        {onToggleAll && (
          <button
            onClick={onToggleAll}
            className="w-9 h-9 md:w-10 md:h-10 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:border-primary hover:text-primary active:scale-95 transition-all opacity-70 hover:opacity-100"
            title={isAllExpanded ? 'Minimize semua' : 'Expand semua'}
          >
            {isAllExpanded ? <Minimize2 className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
          </button>
        )}
        
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={btn.onClick}
            className="w-9 h-9 md:w-10 md:h-10 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:border-primary hover:text-primary active:scale-95 transition-all opacity-70 hover:opacity-100"
            title={btn.label}
          >
            <btn.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Spotlight-style search modal */}
      {searchOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]" 
          onClick={() => setSearchOpen(false)}
        >
          <div 
            className="w-[90%] max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden border border-border/50 popup-scale"
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari anggota keluarga..."
                  className="w-full h-12 pl-12 pr-12 bg-background border border-border rounded-xl text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  autoFocus
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            
            {/* Search results */}
            <div className="max-h-[50vh] overflow-y-auto">
              {searchQuery.trim() === '' ? (
                <div className="p-6 text-center">
                  <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Ketik nama untuk mencari</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Tekan / untuk membuka pencarian</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">Tidak ada hasil untuk "{searchQuery}"</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => {
                        onSelectMember?.(member)
                        setSearchOpen(false)
                        setSearchQuery('')
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 active:bg-muted transition-colors text-left"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        member.gender === 'M' ? 'bg-primary/10' : 'bg-female-accent/10'
                      }`}>
                        <User className={`w-5 h-5 ${member.gender === 'M' ? 'text-primary' : 'text-female-accent'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.name}</p>
                        {member.nickname && (
                          <p className="text-sm text-muted-foreground truncate">{member.nickname}</p>
                        )}
                      </div>
                      {member.isSelf && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-gold/20 text-gold rounded-full">
                          Kamu
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
