'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, User } from 'lucide-react'
import { useNasabStore } from '@/lib/store'
import { getRelationToSelf } from '@/lib/relationship'
import type { Member, Gender } from '@/lib/types'

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
  onSelectMember: (member: Member) => void
}

type Filter = 'all' | 'male' | 'female' | 'deceased'

export function SearchOverlay({ open, onClose, onSelectMember }: SearchOverlayProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { members, getParents, getChildren, getSpouses } = useNasabStore()
  const self = members.find(m => m.isSelf)

  // Focus input on open
  useEffect(() => {
    if (open) {
      setSearch('')
      setFilter('all')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Filter members
  const filteredMembers = members.filter(m => {
    // Text search
    const query = search.toLowerCase()
    const matchesSearch = !search || 
      m.name.toLowerCase().includes(query) || 
      m.nickname?.toLowerCase().includes(query)
    
    // Filter
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'male' && m.gender === 'M') ||
      (filter === 'female' && m.gender === 'F') ||
      (filter === 'deceased' && m.isDeceased)
    
    return matchesSearch && matchesFilter
  })

  const handleSelect = (member: Member) => {
    onClose()
    setTimeout(() => onSelectMember(member), 100)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="h-full flex flex-col max-w-lg mx-auto">
        {/* Header */}
        <div className="p-4 border-b border-border">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama..."
              className="w-full h-12 pl-12 pr-12 text-base bg-card border-2 border-primary rounded-xl focus:outline-none"
            />
            <button
              onClick={onClose}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
            {[
              { id: 'all' as const, label: 'Semua' },
              { id: 'male' as const, label: 'Laki-laki' },
              { id: 'female' as const, label: 'Perempuan' },
              { id: 'deceased' as const, label: 'Almarhum/ah' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  filter === f.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredMembers.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {search ? 'Nggak ketemu.' : 'Tidak ada anggota.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map(member => {
                const relationLabel = self && !member.isSelf
                  ? getRelationToSelf(member.id, self.id, members, getParents, getChildren, getSpouses)
                  : ''

                return (
                  <button
                    key={member.id}
                    onClick={() => handleSelect(member)}
                    className="w-full p-3 bg-card border border-border rounded-xl flex items-center gap-3 hover:border-primary/30 active:scale-[0.98] transition-all text-left"
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ${member.isDeceased ? 'grayscale opacity-70' : ''}`}>
                      <User className="w-5 h-5 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-sm truncate">
                          {member.name}
                        </span>
                        {member.isSelf && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gold/20 text-gold rounded flex-shrink-0">
                            Kamu
                          </span>
                        )}
                      </div>
                      {relationLabel && (
                        <span className="text-xs text-primary">
                          {relationLabel}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Keyboard hint */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            Tekan <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd> untuk menutup
          </p>
        </div>
      </div>
    </div>
  )
}
