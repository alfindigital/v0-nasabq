'use client'

import { useState } from 'react'
import { Maximize2, ZoomIn, ZoomOut, RotateCcw, Minimize2, Expand, Search, X, User } from 'lucide-react'
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
  onFit, 
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

  const buttons = [
    { icon: Maximize2, label: 'Fit to screen', onClick: onFit },
    { icon: ZoomIn, label: 'Zoom in', onClick: onZoomIn },
    { icon: ZoomOut, label: 'Zoom out', onClick: onZoomOut },
    { icon: RotateCcw, label: 'Reset', onClick: onReset },
  ]

  return (
    <div className="zoom-controls fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
      {/* Search button */}
      <button
        onClick={() => setSearchOpen(true)}
        className="w-8 h-8 md:w-9 md:h-9 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:border-primary hover:text-primary active:scale-95 transition-all opacity-60 hover:opacity-100"
        title="Cari anggota"
      >
        <Search className="w-4 h-4" />
      </button>

      {onToggleAll && (
        <button
          onClick={onToggleAll}
          className="w-8 h-8 md:w-9 md:h-9 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:border-primary hover:text-primary active:scale-95 transition-all opacity-60 hover:opacity-100"
          title={isAllExpanded ? 'Minimize semua' : 'Expand semua'}
        >
          {isAllExpanded ? <Minimize2 className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
        </button>
      )}
      
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={btn.onClick}
          className="w-8 h-8 md:w-9 md:h-9 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:border-primary hover:text-primary active:scale-95 transition-all opacity-60 hover:opacity-100"
          title={btn.label}
        >
          <btn.icon className="w-4 h-4" />
        </button>
      ))}

      {/* Search popup */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-20" onClick={() => setSearchOpen(false)}>
          <div 
            className="w-[90%] max-w-sm bg-card rounded-xl shadow-xl overflow-hidden popup-scale"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari anggota keluarga..."
                  className="w-full h-10 pl-9 pr-9 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  autoFocus
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-muted"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {searchQuery.trim() === '' ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Ketik nama untuk mencari...
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Tidak ditemukan.
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
                      className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50 active:bg-muted transition-colors text-left"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        member.gender === 'M' ? 'bg-primary/10' : 'bg-female-accent/10'
                      }`}>
                        <User className={`w-4 h-4 ${member.gender === 'M' ? 'text-primary' : 'text-female-accent'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        {member.nickname && (
                          <p className="text-xs text-muted-foreground truncate">{member.nickname}</p>
                        )}
                      </div>
                      {member.isSelf && (
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-gold/20 text-gold rounded">
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
    </div>
  )
}
