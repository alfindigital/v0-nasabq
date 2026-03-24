'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronRight, User } from 'lucide-react'
import { useNasabStore } from '@/lib/store'
import { getRelationToSelf } from '@/lib/relationship'
import type { Member } from '@/lib/types'

interface MemberListProps {
  onViewMember: (member: Member) => void
}

export function MemberList({ onViewMember }: MemberListProps) {
  const [search, setSearch] = useState('')
  
  const { members, getParents, getChildren, getSpouses } = useNasabStore()
  const self = members.find(m => m.isSelf)

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    let result = members

    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase()
      result = result.filter(m => 
        m.name.toLowerCase().includes(query) ||
        m.nickname?.toLowerCase().includes(query)
      )
    }

    // Sort by generation (root ancestors first), then alphabetically
    const getGeneration = (id: number, visited = new Set<number>()): number => {
      if (visited.has(id)) return 0
      visited.add(id)
      const parents = getParents(id)
      if (parents.length === 0) return 0
      return 1 + Math.max(...parents.map(p => getGeneration(p.id, new Set(visited))))
    }

    result = [...result].sort((a, b) => {
      const genA = getGeneration(a.id)
      const genB = getGeneration(b.id)
      if (genA !== genB) return genA - genB
      return a.name.localeCompare(b.name)
    })

    return result
  }, [members, search, getParents])

  // Get generation number for display
  const getGenNumber = (id: number): number => {
    if (!self) return 0
    let gen = 0
    let current = id
    const visited = new Set<number>()
    
    while (current !== self.id && !visited.has(current)) {
      visited.add(current)
      const parents = getParents(current)
      if (parents.length > 0) {
        current = parents[0].id
        gen++
      } else {
        break
      }
    }
    return gen
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search bar */}
      <div className="p-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama..."
            className="w-full h-10 pl-10 pr-4 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Member list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredMembers.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {search ? 'Nggak ketemu.' : 'Baru ada kamu. Yuk tambahin keluarga!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMembers.map(member => {
              const relationLabel = self 
                ? getRelationToSelf(member.id, self.id, members, getParents, getChildren, getSpouses)
                : ''
              const genNum = getGenNumber(member.id)

              return (
                <button
                  key={member.id}
                  onClick={() => onViewMember(member)}
                  className="w-full p-3 bg-card border border-border rounded-xl flex items-center gap-3 hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                >
                  {/* Avatar */}
                  <div className={`w-[38px] h-[38px] rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ${member.isDeceased ? 'grayscale opacity-70' : ''}`}>
                    <User className="w-5 h-5 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-sm text-foreground truncate">
                        {member.name}
                      </span>
                      {member.isSelf && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gold/20 text-gold rounded flex-shrink-0">
                          Kamu
                        </span>
                      )}
                    </div>
                    
                    {/* Chips */}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded">
                        {member.gender === 'M' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                      {member.birthYear && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded">
                          {member.birthYear}
                        </span>
                      )}
                      {genNum > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded">
                          Gen {genNum}
                        </span>
                      )}
                      {relationLabel && !member.isSelf && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                          {relationLabel}
                        </span>
                      )}
                      {member.isDeceased && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground/60 rounded">
                          {member.gender === 'M' ? 'Almarhum' : 'Almarhumah'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
