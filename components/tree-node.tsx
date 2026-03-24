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

  const handleMouseUp = () => {
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

  // Male = primary/green border, Female = female-accent/pink-purple border
  const genderBorderColor = member.gender === 'M' ? 'border-l-primary' : 'border-l-female-accent'
  
  return (
    <div className="relative">
      <div
        className={`
          flex items-center gap-2.5 h-[46px] px-3 pr-4 bg-card border-2 border-border rounded-full
          cursor-pointer select-none transition-all duration-200
          hover:scale-105 active:scale-100
          ${genderBorderColor} border-l-[4px]
          ${isSelf ? 'ring-2 ring-gold/50 border-gold/30' : ''}
          ${member.isDeceased ? 'opacity-60' : ''}
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
        <div className={`relative w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0 ${
          member.gender === 'M' ? 'bg-primary/15' : 'bg-female-accent/15'
        } ${member.isDeceased ? 'grayscale' : ''}`}>
          <User className={`w-3.5 h-3.5 ${member.gender === 'M' ? 'text-primary' : 'text-female-accent'}`} />
        </div>

        {/* Name */}
        <span className={`font-display font-semibold text-sm text-foreground truncate ${member.isDeceased ? 'line-through decoration-muted-foreground/40' : ''}`}>
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
          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-card border-2 border-border rounded-full flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-colors z-10"
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
