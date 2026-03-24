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

interface PositionedNode {
  id: number
  x: number
  y: number
  gen: number
  familyId: number // Which family tree this node belongs to
}

interface Connection {
  x1: number
  y1: number
  x2: number
  y2: number
  isSpouse?: boolean
}

const NODE_WIDTH = 140
const NODE_HEIGHT = 50
const H_GAP = 30
const V_GAP = 100
const SPOUSE_GAP = 8
const FAMILY_GAP = 80

export function TreeCanvas({ onViewMember, onAddRelative }: TreeCanvasProps) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragTransformStart, setDragTransformStart] = useState({ x: 0, y: 0 })
  const [quickAction, setQuickAction] = useState<{ member: Member; x: number; y: number } | null>(null)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(new Set())
  const [initialized, setInitialized] = useState(false)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const { members, getParents, getChildren, getSpouses } = useNasabStore()
  const self = members.find(m => m.isSelf)

  /**
   * Build the tree layout with proper hierarchy:
   * - Parents are ABOVE children (lower Y)
   * - Spouses are HORIZONTAL (same Y, adjacent X)
   * - Only blood relatives and their spouses are connected
   * - In-laws (spouse's family) are NOT connected to your parents
   */
  const { positions, connections } = useMemo(() => {
    if (!self) return { positions: [], connections: [] }
    
    const nodePositions: PositionedNode[] = []
    const lines: Connection[] = []
    
    // Track which members have been positioned
    const positioned = new Map<number, PositionedNode>()
    
    // Assign generations relative to self (self = 0)
    // Parents = -1, Grandparents = -2, Children = +1, etc.
    const memberGen = new Map<number, number>()
    const memberFamily = new Map<number, number>() // Track which "family tree" each person belongs to
    
    // Build generations from self outward
    const assignGenerations = (id: number, gen: number, familyId: number, visited: Set<number>) => {
      if (visited.has(id)) return
      visited.add(id)
      
      // Only update if not set or this path gives a better (closer to self) generation
      if (!memberGen.has(id)) {
        memberGen.set(id, gen)
        memberFamily.set(id, familyId)
      }
      
      // Spouses share the same generation
      getSpouses(id).forEach(spouse => {
        if (!memberGen.has(spouse.id)) {
          memberGen.set(spouse.id, gen)
          memberFamily.set(spouse.id, familyId)
        }
      })
      
      // Parents are one generation UP (negative)
      getParents(id).forEach(parent => {
        if (!visited.has(parent.id)) {
          assignGenerations(parent.id, gen - 1, familyId, visited)
        }
      })
      
      // Children are one generation DOWN (positive)
      getChildren(id).forEach(child => {
        if (!visited.has(child.id)) {
          assignGenerations(child.id, gen + 1, familyId, visited)
        }
      })
    }
    
    // Start from self
    assignGenerations(self.id, 0, 0, new Set())
    
    // Also assign generations for any disconnected members (spouse's family)
    members.forEach(m => {
      if (!memberGen.has(m.id)) {
        // This is a disconnected family tree (e.g., spouse's parents)
        // Try to find connection through spouses
        const spouses = getSpouses(m.id)
        let found = false
        for (const spouse of spouses) {
          if (memberGen.has(spouse.id)) {
            assignGenerations(m.id, memberGen.get(spouse.id)!, memberFamily.get(spouse.id)!, new Set())
            found = true
            break
          }
        }
        if (!found) {
          // Completely disconnected, give them their own family tree
          assignGenerations(m.id, 0, m.id, new Set())
        }
      }
    })
    
    // Group by generation
    const genGroups = new Map<number, number[]>()
    memberGen.forEach((gen, id) => {
      if (!genGroups.has(gen)) genGroups.set(gen, [])
      genGroups.get(gen)!.push(id)
    })
    
    // Sort generations (negative at top, positive at bottom)
    const sortedGens = Array.from(genGroups.keys()).sort((a, b) => a - b)
    const minGen = Math.min(...sortedGens)
    
    // Check if node should be hidden due to collapsed ancestor
    const isHiddenByCollapse = (id: number, currentGen: number): boolean => {
      // Check all parents
      const parents = getParents(id)
      for (const parent of parents) {
        const parentGen = memberGen.get(parent.id)
        if (parentGen !== undefined && parentGen < currentGen) {
          // This parent is above us
          if (collapsedNodes.has(parent.id)) return true
          // Also check if parent's spouse is collapsed
          for (const ps of getSpouses(parent.id)) {
            if (collapsedNodes.has(ps.id)) return true
          }
        }
      }
      return false
    }
    
    // Position nodes generation by generation
    sortedGens.forEach(gen => {
      const memberIds = genGroups.get(gen) || []
      const genY = (gen - minGen) * (NODE_HEIGHT + V_GAP)
      
      // Sort members: self first, then by family ID, then alphabetically
      const sortedIds = [...memberIds].sort((a, b) => {
        if (a === self.id) return -1
        if (b === self.id) return 1
        const famA = memberFamily.get(a) || 0
        const famB = memberFamily.get(b) || 0
        if (famA !== famB) return famA - famB
        const mA = members.find(m => m.id === a)
        const mB = members.find(m => m.id === b)
        return (mA?.name || '').localeCompare(mB?.name || '')
      })
      
      // Group couples together
      const processed = new Set<number>()
      const groups: number[][] = []
      
      sortedIds.forEach(id => {
        if (processed.has(id)) return
        if (isHiddenByCollapse(id, gen)) {
          processed.add(id)
          return
        }
        
        const group = [id]
        processed.add(id)
        
        // Add spouses to the same group
        getSpouses(id).forEach(spouse => {
          if (!processed.has(spouse.id) && memberGen.get(spouse.id) === gen) {
            if (!isHiddenByCollapse(spouse.id, gen)) {
              group.push(spouse.id)
              processed.add(spouse.id)
            }
          }
        })
        
        groups.push(group)
      })
      
      // Calculate total width needed
      let totalWidth = 0
      groups.forEach((group, i) => {
        totalWidth += group.length * NODE_WIDTH + (group.length - 1) * SPOUSE_GAP
        if (i < groups.length - 1) totalWidth += H_GAP
      })
      
      // Position groups centered
      let currentX = -totalWidth / 2
      
      groups.forEach((group) => {
        group.forEach((id, idx) => {
          const pos: PositionedNode = {
            id,
            x: currentX,
            y: genY,
            gen,
            familyId: memberFamily.get(id) || 0
          }
          nodePositions.push(pos)
          positioned.set(id, pos)
          currentX += NODE_WIDTH + (idx < group.length - 1 ? SPOUSE_GAP : 0)
        })
        currentX += H_GAP
      })
    })
    
    // Build connections
    const drawnConnections = new Set<string>()
    
    nodePositions.forEach(pos => {
      const member = members.find(m => m.id === pos.id)
      if (!member) return
      
      // Draw spouse connections (horizontal)
      getSpouses(pos.id).forEach(spouse => {
        const spousePos = positioned.get(spouse.id)
        if (!spousePos || spousePos.y !== pos.y) return
        
        const key = [pos.id, spouse.id].sort().join('-spouse-')
        if (drawnConnections.has(key)) return
        drawnConnections.add(key)
        
        const leftX = Math.min(pos.x, spousePos.x) + NODE_WIDTH
        const rightX = Math.max(pos.x, spousePos.x)
        const y = pos.y + NODE_HEIGHT / 2
        
        lines.push({ x1: leftX, y1: y, x2: rightX, y2: y, isSpouse: true })
      })
      
      // Skip parent-child connections if this node is collapsed
      if (collapsedNodes.has(pos.id)) return
      
      // Draw parent-to-children connections
      const children = getChildren(pos.id)
      const visibleChildren = children.filter(c => positioned.has(c.id))
      
      if (visibleChildren.length === 0) return
      
      // Get all people at this position who are parents of these children (couple)
      const coupleAtPos = [pos.id]
      getSpouses(pos.id).forEach(spouse => {
        const sp = positioned.get(spouse.id)
        if (sp && sp.y === pos.y) {
          // Check if spouse is also a parent of these children
          const spouseChildren = getChildren(spouse.id)
          if (spouseChildren.some(sc => visibleChildren.some(vc => vc.id === sc.id))) {
            coupleAtPos.push(spouse.id)
          }
        }
      })
      
      // Calculate parent connection point (center of couple)
      const couplePositions = coupleAtPos.map(id => positioned.get(id)!).filter(Boolean)
      const coupleMinX = Math.min(...couplePositions.map(p => p.x))
      const coupleMaxX = Math.max(...couplePositions.map(p => p.x)) + NODE_WIDTH
      const parentCenterX = (coupleMinX + coupleMaxX) / 2
      const parentBottomY = pos.y + NODE_HEIGHT
      
      // Get child positions
      const childPositions = visibleChildren
        .map(c => positioned.get(c.id))
        .filter((p): p is PositionedNode => p !== undefined)
        .sort((a, b) => a.x - b.x)
      
      if (childPositions.length === 0) return
      
      // Connection key to avoid duplicates
      const connectionKey = `parent-${coupleAtPos.sort().join(',')}-children-${visibleChildren.map(c => c.id).sort().join(',')}`
      if (drawnConnections.has(connectionKey)) return
      drawnConnections.add(connectionKey)
      
      const midY = parentBottomY + V_GAP / 2
      
      // Vertical line from parent to midpoint
      lines.push({ x1: parentCenterX, y1: parentBottomY, x2: parentCenterX, y2: midY })
      
      if (childPositions.length === 1) {
        // Single child - straight vertical line
        const childCenterX = childPositions[0].x + NODE_WIDTH / 2
        const childTopY = childPositions[0].y
        
        // Horizontal line to align with child if needed
        if (Math.abs(childCenterX - parentCenterX) > 1) {
          lines.push({ x1: parentCenterX, y1: midY, x2: childCenterX, y2: midY })
        }
        // Vertical line down to child
        lines.push({ x1: childCenterX, y1: midY, x2: childCenterX, y2: childTopY })
      } else {
        // Multiple children - horizontal bar + verticals
        const leftChildCenterX = childPositions[0].x + NODE_WIDTH / 2
        const rightChildCenterX = childPositions[childPositions.length - 1].x + NODE_WIDTH / 2
        
        // Horizontal bar across all children
        lines.push({ x1: leftChildCenterX, y1: midY, x2: rightChildCenterX, y2: midY })
        
        // Connect parent drop-line to the bar
        if (parentCenterX < leftChildCenterX) {
          lines.push({ x1: parentCenterX, y1: midY, x2: leftChildCenterX, y2: midY })
        } else if (parentCenterX > rightChildCenterX) {
          lines.push({ x1: parentCenterX, y1: midY, x2: rightChildCenterX, y2: midY })
        }
        
        // Vertical lines down to each child
        childPositions.forEach(cp => {
          const childCenterX = cp.x + NODE_WIDTH / 2
          lines.push({ x1: childCenterX, y1: midY, x2: childCenterX, y2: cp.y })
        })
      }
    })
    
    return { positions: nodePositions, connections: lines }
  }, [members, self, getParents, getChildren, getSpouses, collapsedNodes])

  // Fit to screen
  const handleFitToScreen = useCallback(() => {
    if (!canvasRef.current || positions.length === 0) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const minX = Math.min(...positions.map(p => p.x))
    const maxX = Math.max(...positions.map(p => p.x)) + NODE_WIDTH
    const minY = Math.min(...positions.map(p => p.y))
    const maxY = Math.max(...positions.map(p => p.y)) + NODE_HEIGHT
    
    const treeWidth = maxX - minX + 80
    const treeHeight = maxY - minY + 80
    
    const scaleX = rect.width / treeWidth
    const scaleY = rect.height / treeHeight
    const scale = Math.min(scaleX, scaleY, 1.2)
    
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    
    setTransform({
      x: rect.width / 2 - centerX * scale,
      y: rect.height / 2 - centerY * scale,
      scale: Math.max(0.4, Math.min(scale, 1.2))
    })
  }, [positions])

  // Initialize view
  useEffect(() => {
    if (self && !initialized && positions.length > 0) {
      setTimeout(handleFitToScreen, 100)
      setInitialized(true)
    }
  }, [self, initialized, positions.length, handleFitToScreen])

  // Re-fit when members change
  useEffect(() => {
    if (initialized) {
      handleFitToScreen()
    }
  }, [members.length])

  // Pan handlers (mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.tree-node, .quick-action, .zoom-controls')) return
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setDragTransformStart({ x: transform.x, y: transform.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    setTransform(t => ({ ...t, x: dragTransformStart.x + dx, y: dragTransformStart.y + dy }))
  }

  const handleMouseUp = () => setIsDragging(false)

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.tree-node, .quick-action, .zoom-controls')) return
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
      setDragTransformStart({ x: transform.x, y: transform.y })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    const dx = e.touches[0].clientX - dragStart.x
    const dy = e.touches[0].clientY - dragStart.y
    setTransform(t => ({ ...t, x: dragTransformStart.x + dx, y: dragTransformStart.y + dy }))
  }

  const handleTouchEnd = () => setIsDragging(false)

  // Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setTransform(t => ({ ...t, scale: Math.min(2, Math.max(0.3, t.scale + delta)) }))
  }

  const handleZoomIn = () => setTransform(t => ({ ...t, scale: Math.min(2, t.scale + 0.2) }))
  const handleZoomOut = () => setTransform(t => ({ ...t, scale: Math.max(0.3, t.scale - 0.2) }))

  // Collapse/expand
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

  const handleToggleAll = () => {
    const nodesWithChildren = members.filter(m => getChildren(m.id).length > 0).map(m => m.id)
    if (collapsedNodes.size === 0) {
      setCollapsedNodes(new Set(nodesWithChildren.filter(id => id !== self?.id)))
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

  // Empty state (only self)
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
          Tap atau tekan lama untuk mulai menambah keluarga
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
        {/* SVG for connection lines */}
        <svg
          className="absolute pointer-events-none"
          style={{ left: -2000, top: -1000, width: 5000, height: 3000 }}
        >
          <g transform="translate(2000, 1000)">
            {connections.map((line, i) => (
              <line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="var(--primary)"
                strokeWidth={line.isSpouse ? 2 : 2}
                strokeOpacity={line.isSpouse ? 0.6 : 0.35}
              />
            ))}
            {/* Marriage indicator dots */}
            {connections.filter(l => l.isSpouse).map((line, i) => (
              <circle
                key={`marriage-${i}`}
                cx={(line.x1 + line.x2) / 2}
                cy={line.y1}
                r={4}
                fill="var(--primary)"
                fillOpacity={0.6}
              />
            ))}
          </g>
        </svg>

        {/* Nodes */}
        {positions.map(pos => {
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
