'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useNasabStore } from '@/lib/store'
import type { Member } from '@/lib/types'
import { TreeNode } from './tree-node'
import { QuickActionPopup } from './quick-action-popup'
import { ZoomControls } from './zoom-controls'

interface TreeCanvasProps {
  onViewMember: (member: Member) => void
  onAddRelative: (context: { targetId: number; relationshipType: 'child' | 'parent' | 'spouse' }) => void
}

interface NodePosition {
  id: number
  x: number
  y: number
  generation: number
}

const NODE_WIDTH = 140
const NODE_HEIGHT = 50
const H_GAP = 40
const V_GAP = 100
const SPOUSE_GAP = 10

export function TreeCanvas({ onViewMember, onAddRelative }: TreeCanvasProps) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [lastTransform, setLastTransform] = useState({ x: 0, y: 0 })
  const [quickAction, setQuickAction] = useState<{ member: Member; x: number; y: number } | null>(null)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(new Set())
  const [initialized, setInitialized] = useState(false)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const { members, getParents, getChildren, getSpouses } = useNasabStore()
  const self = members.find(m => m.isSelf)

  // Build positions with proper hierarchy: parents TOP, children BOTTOM
  const { nodePositions, connectorLines } = useMemo(() => {
    if (!self) return { nodePositions: [], connectorLines: [] }
    
    const positions: NodePosition[] = []
    const lines: { x1: number; y1: number; x2: number; y2: number; isSpouse?: boolean }[] = []
    const memberGen = new Map<number, number>()
    const processed = new Set<number>()

    // Calculate generations: self=0, parents=-1,-2..., children=+1,+2...
    const calcGen = (id: number, gen: number, direction: 'up' | 'down' | 'both') => {
      const current = memberGen.get(id)
      if (current !== undefined) {
        if (direction === 'up' && current <= gen) return
        if (direction === 'down' && current >= gen) return
      }
      memberGen.set(id, gen)

      // Same-generation spouses
      getSpouses(id).forEach(s => {
        if (!memberGen.has(s.id)) memberGen.set(s.id, gen)
      })

      if (direction === 'up' || direction === 'both') {
        getParents(id).forEach(p => calcGen(p.id, gen - 1, 'up'))
      }
      if (direction === 'down' || direction === 'both') {
        getChildren(id).forEach(c => calcGen(c.id, gen + 1, 'down'))
      }
    }
    calcGen(self.id, 0, 'both')

    // Group members by generation
    const genGroups = new Map<number, number[]>()
    memberGen.forEach((gen, id) => {
      if (!genGroups.has(gen)) genGroups.set(gen, [])
      genGroups.get(gen)!.push(id)
    })

    // Sort generations (negative = ancestors at top, positive = descendants at bottom)
    const sortedGens = Array.from(genGroups.keys()).sort((a, b) => a - b)

    // Check if a node or its descendants are collapsed
    const isHidden = (id: number): boolean => {
      const parents = getParents(id)
      for (const p of parents) {
        if (collapsedNodes.has(p.id)) return true
        // Check if parent's spouse is collapsed
        const pSpouses = getSpouses(p.id)
        for (const ps of pSpouses) {
          if (collapsedNodes.has(ps.id)) return true
        }
      }
      return false
    }

    // Position each generation
    sortedGens.forEach((gen, genIdx) => {
      const memberIds = genGroups.get(gen) || []
      const genProcessed = new Set<number>()
      let xOffset = 0

      // Sort: self first, then by relationships
      const sortedIds = [...memberIds].sort((a, b) => {
        if (a === self.id) return -1
        if (b === self.id) return 1
        return 0
      })

      sortedIds.forEach(id => {
        if (genProcessed.has(id) || processed.has(id)) return
        if (isHidden(id)) return

        const member = members.find(m => m.id === id)
        if (!member) return

        const spouses = getSpouses(id).filter(s => 
          memberGen.get(s.id) === gen && !genProcessed.has(s.id) && !processed.has(s.id) && !isHidden(s.id)
        )

        // Y position based on generation index (top = 0)
        const y = genIdx * (NODE_HEIGHT + V_GAP)

        // Add main member
        positions.push({ id, x: xOffset, y, generation: gen })
        genProcessed.add(id)
        processed.add(id)

        // Add spouses horizontally
        spouses.forEach(spouse => {
          xOffset += NODE_WIDTH + SPOUSE_GAP
          positions.push({ id: spouse.id, x: xOffset, y, generation: gen })
          genProcessed.add(spouse.id)
          processed.add(spouse.id)
        })

        xOffset += NODE_WIDTH + H_GAP
      })
    })

    // Center the tree horizontally
    if (positions.length > 0) {
      const minX = Math.min(...positions.map(p => p.x))
      const maxX = Math.max(...positions.map(p => p.x))
      const centerOffset = (minX + maxX + NODE_WIDTH) / 2
      positions.forEach(p => p.x -= centerOffset)
    }

    // Build position lookup
    const posMap = new Map(positions.map(p => [p.id, p]))

    // Generate connector lines
    const drawnConnections = new Set<string>()

    positions.forEach(pos => {
      const member = members.find(m => m.id === pos.id)
      if (!member) return

      // Spouse connector (horizontal)
      const spouses = getSpouses(pos.id)
      spouses.forEach(spouse => {
        const spousePos = posMap.get(spouse.id)
        if (!spousePos || spousePos.y !== pos.y) return
        const key = [pos.id, spouse.id].sort().join('-')
        if (drawnConnections.has(key)) return
        drawnConnections.add(key)

        // Horizontal line between spouses
        const leftX = Math.min(pos.x, spousePos.x) + NODE_WIDTH
        const rightX = Math.max(pos.x, spousePos.x)
        const y = pos.y + NODE_HEIGHT / 2
        lines.push({ x1: leftX, y1: y, x2: rightX, y2: y, isSpouse: true })
      })

      // Parent to children connector (vertical from parent down to children)
      if (collapsedNodes.has(pos.id)) return

      const children = getChildren(pos.id)
      const visibleChildren = children.filter(c => posMap.has(c.id))
      
      if (visibleChildren.length === 0) return

      // Find all spouses at same position
      const coupleIds = [pos.id, ...spouses.map(s => s.id)].filter(id => {
        const p = posMap.get(id)
        return p && p.y === pos.y
      })

      // Calculate start point (center of couple or single parent)
      const couplePositions = coupleIds.map(id => posMap.get(id)!).filter(Boolean)
      const coupleMinX = Math.min(...couplePositions.map(p => p.x))
      const coupleMaxX = Math.max(...couplePositions.map(p => p.x)) + NODE_WIDTH
      const startX = (coupleMinX + coupleMaxX) / 2
      const startY = pos.y + NODE_HEIGHT

      // Get children positions sorted by x
      const childPositions = visibleChildren
        .map(c => posMap.get(c.id))
        .filter((p): p is NodePosition => p !== undefined)
        .sort((a, b) => a.x - b.x)

      const midY = startY + V_GAP / 2

      // Vertical line from parent to midpoint
      lines.push({ x1: startX, y1: startY, x2: startX, y2: midY })

      if (childPositions.length === 1) {
        // Single child: straight vertical line
        const cp = childPositions[0]
        const childCenterX = cp.x + NODE_WIDTH / 2
        // Horizontal to align with child
        if (Math.abs(childCenterX - startX) > 1) {
          lines.push({ x1: startX, y1: midY, x2: childCenterX, y2: midY })
        }
        // Vertical down to child
        lines.push({ x1: childCenterX, y1: midY, x2: childCenterX, y2: cp.y })
      } else {
        // Multiple children: horizontal bar + verticals
        const leftChildX = childPositions[0].x + NODE_WIDTH / 2
        const rightChildX = childPositions[childPositions.length - 1].x + NODE_WIDTH / 2

        // Horizontal bar spanning all children
        lines.push({ x1: leftChildX, y1: midY, x2: rightChildX, y2: midY })

        // Connect parent drop to bar if needed
        if (startX < leftChildX) {
          lines.push({ x1: startX, y1: midY, x2: leftChildX, y2: midY })
        } else if (startX > rightChildX) {
          lines.push({ x1: startX, y1: midY, x2: rightChildX, y2: midY })
        }

        // Vertical line down to each child
        childPositions.forEach(cp => {
          const childCenterX = cp.x + NODE_WIDTH / 2
          lines.push({ x1: childCenterX, y1: midY, x2: childCenterX, y2: cp.y })
        })
      }
    })

    return { nodePositions: positions, connectorLines: lines }
  }, [members, self, getParents, getChildren, getSpouses, collapsedNodes])

  // Fit to screen
  const handleFitToScreen = useCallback(() => {
    if (!canvasRef.current || nodePositions.length === 0) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const minX = Math.min(...nodePositions.map(p => p.x))
    const maxX = Math.max(...nodePositions.map(p => p.x)) + NODE_WIDTH
    const minY = Math.min(...nodePositions.map(p => p.y))
    const maxY = Math.max(...nodePositions.map(p => p.y)) + NODE_HEIGHT
    
    const treeWidth = maxX - minX + 100
    const treeHeight = maxY - minY + 100
    
    const scale = Math.min(rect.width / treeWidth, rect.height / treeHeight, 1.2)
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    
    const newX = rect.width / 2 - centerX * scale
    const newY = rect.height / 2 - centerY * scale
    
    setTransform({ x: newX, y: newY, scale: Math.max(0.4, Math.min(scale, 1.2)) })
    setLastTransform({ x: newX, y: newY })
  }, [nodePositions])

  // Initialize
  useEffect(() => {
    if (self && !initialized && nodePositions.length > 0) {
      handleFitToScreen()
      setInitialized(true)
    }
  }, [self, initialized, nodePositions.length, handleFitToScreen])

  // Re-fit when members change
  useEffect(() => {
    if (initialized && nodePositions.length > 0) {
      handleFitToScreen()
    }
  }, [members.length])

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.tree-node, .quick-action')) return
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setLastTransform({ x: transform.x, y: transform.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setTransform(t => ({
      ...t,
      x: lastTransform.x + (e.clientX - dragStart.x),
      y: lastTransform.y + (e.clientY - dragStart.y)
    }))
  }

  const handleMouseUp = () => {
    if (isDragging) setLastTransform({ x: transform.x, y: transform.y })
    setIsDragging(false)
  }

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.tree-node, .quick-action')) return
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
      setLastTransform({ x: transform.x, y: transform.y })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    setTransform(t => ({
      ...t,
      x: lastTransform.x + (e.touches[0].clientX - dragStart.x),
      y: lastTransform.y + (e.touches[0].clientY - dragStart.y)
    }))
  }

  const handleTouchEnd = () => {
    if (isDragging) setLastTransform({ x: transform.x, y: transform.y })
    setIsDragging(false)
  }

  // Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setTransform(t => ({ ...t, scale: Math.min(2, Math.max(0.3, t.scale + delta)) }))
  }

  const handleZoomIn = () => setTransform(t => ({ ...t, scale: Math.min(2, t.scale + 0.2) }))
  const handleZoomOut = () => setTransform(t => ({ ...t, scale: Math.max(0.3, t.scale - 0.2) }))

  // Toggle expand/collapse for a node
  const toggleCollapse = (id: number) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Toggle all
  const handleToggleAll = () => {
    const hasChildren = members.filter(m => getChildren(m.id).length > 0).map(m => m.id)
    if (collapsedNodes.size === 0) {
      // Collapse all except self
      setCollapsedNodes(new Set(hasChildren.filter(id => id !== self?.id)))
    } else {
      setCollapsedNodes(new Set())
    }
  }

  // Node interactions
  const handleNodeTap = (member: Member) => onViewMember(member)

  const handleNodeLongPress = (member: Member, e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setQuickAction({ member, x: clientX - rect.left, y: clientY - rect.top })
  }

  const handleQuickAction = (action: 'spouse' | 'parent' | 'child' | 'edit') => {
    if (!quickAction) return
    if (action === 'edit') {
      onViewMember(quickAction.member)
    } else {
      onAddRelative({ targetId: quickAction.member.id, relationshipType: action })
    }
    setQuickAction(null)
  }

  // Empty state
  if (members.length === 1 && self) {
    return (
      <div className="h-full bg-canvas canvas-pattern flex flex-col items-center justify-center p-6 text-center">
        <TreeNode
          member={self}
          isSelf
          isNew={false}
          onTap={() => onViewMember(self)}
          onLongPress={(e) => handleNodeLongPress(self, e)}
        />
        <p className="text-sm text-muted-foreground mt-6 max-w-[200px]">
          Tap atau tekan lama pada namamu untuk mulai menambah keluarga.
        </p>
        <ZoomControls
          onFit={handleFitToScreen}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleFitToScreen}
          onToggleAll={handleToggleAll}
          isAllExpanded={collapsedNodes.size === 0}
        />
      </div>
    )
  }

  return (
    <div
      ref={canvasRef}
      className={`h-full bg-canvas canvas-pattern overflow-hidden relative select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onDoubleClick={handleFitToScreen}
    >
      <div
        className="absolute"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out'
        }}
      >
        {/* Connector lines */}
        <svg
          className="absolute pointer-events-none"
          style={{ left: -2000, top: -1000, width: 5000, height: 3000 }}
        >
          <g transform="translate(2000, 1000)">
            {connectorLines.map((line, i) => (
              <line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={line.isSpouse ? 'var(--primary)' : 'var(--primary)'}
                strokeWidth={line.isSpouse ? 2 : 2}
                strokeOpacity={line.isSpouse ? 0.7 : 0.4}
              />
            ))}
            {/* Marriage dots */}
            {connectorLines.filter(l => l.isSpouse).map((line, i) => (
              <circle
                key={`dot-${i}`}
                cx={(line.x1 + line.x2) / 2}
                cy={line.y1}
                r={4}
                fill="var(--primary)"
                fillOpacity={0.7}
              />
            ))}
          </g>
        </svg>

        {/* Nodes */}
        {nodePositions.map(pos => {
          const member = members.find(m => m.id === pos.id)
          if (!member) return null
          const childCount = getChildren(pos.id).length
          const isCollapsed = collapsedNodes.has(pos.id)

          return (
            <div
              key={pos.id}
              className="absolute tree-node"
              style={{ left: pos.x, top: pos.y }}
            >
              <TreeNode
                member={member}
                isSelf={member.isSelf}
                isNew={false}
                hasChildren={childCount > 0}
                isExpanded={!isCollapsed}
                childCount={childCount}
                onTap={() => handleNodeTap(member)}
                onLongPress={(e) => handleNodeLongPress(member, e)}
                onToggleExpand={() => toggleCollapse(pos.id)}
              />
            </div>
          )
        })}
      </div>

      {quickAction && (
        <div className="quick-action">
          <QuickActionPopup
            x={quickAction.x}
            y={quickAction.y}
            member={quickAction.member}
            onAction={handleQuickAction}
            onClose={() => setQuickAction(null)}
          />
        </div>
      )}

      <ZoomControls
        onFit={handleFitToScreen}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleFitToScreen}
        onToggleAll={handleToggleAll}
        isAllExpanded={collapsedNodes.size === 0}
      />
    </div>
  )
}
