'use client'

import { useRef } from 'react'
import type { Member } from '@/lib/types'
import { User, ChevronDown, ChevronUp, Star } from 'lucide-react'

interface TreeNodeProps {
  member: Member
  isSelf: boolean
  isNew: boolean
  hasChildren?: boolean
  isExpanded?: boolean
  childCount?: number
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
  onTap,
  onLongPress,
  onToggleExpand
}: TreeNodeProps) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const isLongPress = useRef(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      onLongPress(e)
    }, 500)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (!isLongPress.current) {
      onTap()
    }
  }

  const handleMouseLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      onLongPress(e)
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (!isLongPress.current) {
      onTap()
    }
  }

  const genderBorderColor = member.gender === 'M' ? 'border-l-primary' : 'border-l-female-accent'
  
  return (
    <div className="relative">
      <div
        className={`
          flex items-center gap-2 h-[46px] px-2 pr-3.5 bg-card border-[1.5px] border-border rounded-full
          cursor-pointer select-none transition-all duration-200
          hover:scale-105 active:scale-100
          ${genderBorderColor} border-l-[3px]
          ${isSelf ? 'gold-pulse' : 'shadow-[0_0_0_3px_var(--accent-glow)] hover:shadow-[0_0_0_6px_var(--accent-glow-hover)]'}
          ${member.isDeceased ? 'opacity-70' : ''}
          ${isNew ? 'node-pop' : ''}
        `}
        style={{ maxWidth: 160, minWidth: 100 }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Avatar */}
        <div className={`relative w-[30px] h-[30px] rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ${member.isDeceased ? 'grayscale' : ''}`}>
          <User className="w-4 h-4 text-primary" />
          {member.isDeceased && (
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-card rounded-full flex items-center justify-center">
              <Star className="w-2 h-2 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Name */}
        <span className={`font-display font-semibold text-sm text-foreground truncate ${member.isDeceased ? 'line-through decoration-muted-foreground/30' : ''}`}>
          {member.nickname || member.name.split(' ')[0]}
        </span>
      </div>

      {/* Expand/Collapse button */}
      {hasChildren && onToggleExpand && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-card border border-border rounded-full flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-colors z-10"
        >
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <span className="text-[10px] font-semibold text-primary">{childCount}</span>
          )}
        </button>
      )}
    </div>
  )
}
