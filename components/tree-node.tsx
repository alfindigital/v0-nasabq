'use client'

import { useRef } from 'react'
import type { Member } from '@/lib/types'
import { User, ChevronDown, ChevronUp } from 'lucide-react'

interface TreeNodeProps {
  member: Member
  isSelf: boolean
  isNew: boolean
  hasChildren?: boolean
  isExpanded?: boolean
  childCount?: number
  mahramStatus?: 'mahram' | 'non-mahram' | 'spouse' | 'same-gender' | 'self'
  onTap: () => void
  onLongPress: (e: React.MouseEvent | React.TouchEvent) => void
  onToggleExpand?: () => void
}

export function TreeNode({
  member,
  isSelf,
  isNew,
  hasChildren,
  isExpanded,
  childCount,
  mahramStatus,
  onTap,
  onLongPress,
  onToggleExpand
}: TreeNodeProps) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const touchMoved = useRef(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchMoved.current = false
    longPressTimer.current = setTimeout(() => {
      if (!touchMoved.current) {
        onLongPress(e)
      }
    }, 500)
  }

  const handleTouchMove = () => {
    touchMoved.current = true
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    // If not moved and timer was cleared (short tap), trigger tap
    if (!touchMoved.current) {
      e.preventDefault() // Prevent click event from also firing
      onTap()
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    // Only handle click for non-touch devices (mouse)
    if (e.detail === 1) {
      onTap()
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onLongPress(e)
  }

  const genderBorderColor = member.gender === 'M' ? 'border-l-primary' : 'border-l-female-accent'
  
  // Mahram indicator: green = mahram (safe), red = non-mahram (boundaries needed)
  // Only show for opposite gender, not for self or same gender
  const showMahramIndicator = mahramStatus && mahramStatus !== 'self' && mahramStatus !== 'same-gender'
  
  return (
    <div className="relative" style={{ width: 140 }}>
      <div
        className={`
          relative flex items-center gap-2 h-[50px] px-3 bg-card border-2 border-border rounded-full
          cursor-pointer select-none transition-all duration-200
          hover:scale-105 active:scale-100
          ${genderBorderColor} border-l-4
          ${isSelf ? 'ring-2 ring-gold/60 border-gold/40' : ''}
          ${member.isDeceased ? 'opacity-60' : ''}
          ${isNew ? 'animate-pulse ring-2 ring-primary' : ''}
        `}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mahram indicator light - green = mahram (boleh bersentuhan), red = non-mahram (tidak boleh bersentuhan) */}
        {showMahramIndicator && (
          <div 
            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card shadow-sm ${
              mahramStatus === 'mahram' || mahramStatus === 'spouse' ? 'bg-green-500' : 'bg-red-500'
            }`}
            title={
              mahramStatus === 'mahram' || mahramStatus === 'spouse' ? 'Mahram (boleh bersentuhan)' : 'Non-Mahram (tidak boleh bersentuhan)'
            }
          />
        )}

        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          member.gender === 'M' ? 'bg-primary/20' : 'bg-female-accent/20'
        }`}>
          <User className={`w-4 h-4 ${member.gender === 'M' ? 'text-primary' : 'text-female-accent'}`} />
        </div>

        <span className={`font-display font-semibold text-sm text-foreground truncate flex-1 ${
          member.isDeceased ? 'line-through decoration-muted-foreground/50' : ''
        }`}>
          {member.nickname || member.name.split(' ')[0]}
        </span>
      </div>

      {/* Expand/Collapse toggle button - positioned at bottom center */}
      {hasChildren && onToggleExpand && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleExpand()
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-card border-2 border-border rounded-full flex items-center justify-center hover:border-primary hover:bg-primary/10 active:scale-90 transition-all z-20"
        >
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <span className="text-[10px] font-bold text-primary">{childCount}</span>
          )}
        </button>
      )}
    </div>
  )
}
