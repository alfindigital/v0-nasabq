'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
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
  spouseId?: number
  isSpouse?: boolean
}

export function TreeCanvas({ onViewMember, onAddRelative }: TreeCanvasProps) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [quickAction, setQuickAction] = useState<{ member: Member; x: number; y: number } | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [newNodeId, setNewNodeId] = useState<number | null>(null)
  const [initialized, setInitialized] = useState(false)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  
  const { members, getParents, getChildren, getSpouses } = useNasabStore()
  const self = members.find(m => m.isSelf)

  // Constants for layout
  const NODE_WIDTH = 140
  const NODE_HEIGHT = 46
  const H_GAP = 40 // Horizontal gap between unrelated nodes
  const V_GAP = 100 // Vertical gap between generations
  const SPOUSE_GAP = 16 // Small gap between spouses (horizontal)

  // Build tree structure and calculate positions
  const nodePositions = useMemo(() => {
    if (!self) return []
    
    const positions: NodePosition[] = []
    const visited = new Set<number>()

    // Calculate generations by traversing from self
    const memberGenerations = new Map<number, number>()
    
    const calculateGenerations = (id: number, gen: number, visited: Set<number>) => {
      if (visited.has(id)) return
      visited.add(id)
      memberGenerations.set(id, gen)
      
      const parents = getParents(id)
      parents.forEach(p => calculateGenerations(p.id, gen - 1, new Set(visited)))
      
      const children = getChildren(id)
      children.forEach(c => calculateGenerations(c.id, gen + 1, new Set(visited)))
      
      const spouses = getSpouses(id)
      spouses.forEach(s => {
        if (!memberGenerations.has(s.id)) {
          memberGenerations.set(s.id, gen)
        }
      })
    }
    
    calculateGenerations(self.id, 0, new Set())

    // Group by generation
    const generations = new Map<number, Member[]>()
    members.forEach(m => {
      const gen = memberGenerations.get(m.id)
      if (gen !== undefined) {
        if (!generations.has(gen)) generations.set(gen, [])
        generations.get(gen)!.push(m)
      }
    })

    // Position nodes by generation
    const sortedGens = Array.from(generations.keys()).sort((a, b) => a - b)
    
    sortedGens.forEach(gen => {
      const genMembers = generations.get(gen)!
      const processedInGen = new Set<number>()
      let xOffset = 0
      
      // Sort to prioritize self and keep families together
      const sortedMembers = [...genMembers].sort((a, b) => {
        if (a.isSelf) return -1
        if (b.isSelf) return 1
        return 0
      })

      // Group spouses together horizontally
      sortedMembers.forEach(member => {
        if (processedInGen.has(member.id)) return
        
        const spouses = getSpouses(member.id).filter(s => memberGenerations.get(s.id) === gen)
        
        // Determine if this member should be visible
        const isVisible = expandedNodes.size === 0 || 
                          member.isSelf || 
                          getParents(member.id).some(p => expandedNodes.has(p.id)) ||
                          spouses.some(s => getParents(s.id).some(p => expandedNodes.has(p.id))) ||
                          expandedNodes.has(member.id)

        if (!isVisible && gen !== 0) return

        // Position member
        positions.push({
          id: member.id,
          x: xOffset,
          y: gen * (NODE_HEIGHT + V_GAP),
          generation: gen,
          spouseId: spouses[0]?.id,
          isSpouse: false
        })
        processedInGen.add(member.id)
        
        // Position spouse(s) horizontally next to member
        spouses.forEach(spouse => {
          if (!processedInGen.has(spouse.id)) {
            xOffset += NODE_WIDTH + SPOUSE_GAP
            positions.push({
              id: spouse.id,
              x: xOffset,
              y: gen * (NODE_HEIGHT + V_GAP),
              generation: gen,
              spouseId: member.id,
              isSpouse: true
            })
            processedInGen.add(spouse.id)
          }
        })
        
        xOffset += NODE_WIDTH + H_GAP
      })
    })

    // Center horizontally
    if (positions.length > 0) {
      const minX = Math.min(...positions.map(p => p.x))
      const maxX = Math.max(...positions.map(p => p.x))
      const centerX = (minX + maxX) / 2
      positions.forEach(p => p.x -= centerX)
    }

    return positions
  }, [members, self, getParents, getChildren, getSpouses, expandedNodes])

  // Expand all nodes by default on first load
  useEffect(() => {
    if (self && !initialized) {
      const allIds = new Set<number>(members.map(m => m.id))
      setExpandedNodes(allIds)
      setInitialized(true)
    }
  }, [self, members, initialized])

  // Auto-fit to screen on first render
  useEffect(() => {
    if (initialized && nodePositions.length > 0 && canvasRef.current) {
      handleFitToScreen()
    }
  }, [initialized, nodePositions.length])

  // Clear new node highlight after animation
  useEffect(() => {
    if (newNodeId !== null) {
      const timer = setTimeout(() => setNewNodeId(null), 1000)
      return () => clearTimeout(timer)
    }
  }, [newNodeId])

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setTransform(t => ({ ...t, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      setIsDragging(true)
      setDragStart({ x: touch.clientX - transform.x, y: touch.clientY - transform.y })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0]
      setTransform(t => ({ ...t, x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y }))
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setTransform(t => ({
      ...t,
      scale: Math.min(2, Math.max(0.3, t.scale + delta))
    }))
  }

  // Double tap to fit
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      handleFitToScreen()
    }
  }

  // Zoom controls
  const handleZoomIn = () => setTransform(t => ({ ...t, scale: Math.min(2, t.scale + 0.2) }))
  const handleZoomOut = () => setTransform(t => ({ ...t, scale: Math.max(0.3, t.scale - 0.2) }))
  const handleReset = () => setTransform({ x: 0, y: 0, scale: 1 })
  
  const handleFitToScreen = () => {
    if (!canvasRef.current || nodePositions.length === 0) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const minX = Math.min(...nodePositions.map(p => p.x))
    const maxX = Math.max(...nodePositions.map(p => p.x)) + NODE_WIDTH
    const minY = Math.min(...nodePositions.map(p => p.y))
    const maxY = Math.max(...nodePositions.map(p => p.y)) + NODE_HEIGHT
    
    const treeWidth = maxX - minX + 80
    const treeHeight = maxY - minY + 80
    
    const scale = Math.min(
      rect.width / treeWidth,
      rect.height / treeHeight,
      1.2
    )
    
    setTransform({
      x: rect.width / 2,
      y: rect.height / 3,
      scale: Math.max(0.4, Math.min(scale, 1.2))
    })
  }

  // Node interactions
  const handleNodeTap = (member: Member) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    onViewMember(member)
  }

  const handleNodeLongPress = (member: Member, e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    setQuickAction({
      member,
      x: clientX - rect.left,
      y: clientY - rect.top
    })
  }

  const handleQuickAction = (action: 'spouse' | 'parent' | 'child' | 'edit') => {
    if (!quickAction) return
    
    if (action === 'edit') {
      onViewMember(quickAction.member)
    } else {
      onAddRelative({
        targetId: quickAction.member.id,
        relationshipType: action
      })
    }
    setQuickAction(null)
  }

  const toggleExpand = (id: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        // Also collapse all descendants
        const descendants = getChildren(id)
        descendants.forEach(d => next.delete(d.id))
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Generate connector lines SVG
  const renderConnectors = () => {
    const lines: JSX.Element[] = []
    const posMap = new Map(nodePositions.map(p => [p.id, p]))
    
    nodePositions.forEach(pos => {
      const member = members.find(m => m.id === pos.id)
      if (!member) return
      
      // Spouse connector (horizontal line between spouses)
      if (pos.spouseId && !pos.isSpouse) {
        const spousePos = posMap.get(pos.spouseId)
        if (spousePos) {
          const y = pos.y + NODE_HEIGHT / 2
          lines.push(
            <g key={`spouse-${pos.id}-${pos.spouseId}`}>
              <line
                x1={pos.x + NODE_WIDTH}
                y1={y}
                x2={spousePos.x}
                y2={y}
                stroke="var(--primary)"
                strokeWidth="2"
                strokeOpacity="0.4"
              />
              {/* Marriage indicator */}
              <circle
                cx={(pos.x + NODE_WIDTH + spousePos.x) / 2}
                cy={y}
                r="4"
                fill="var(--primary)"
                fillOpacity="0.5"
              />
            </g>
          )
        }
      }
      
      // Parent-child connectors (vertical lines)
      const children = getChildren(pos.id)
      const visibleChildren = children.filter(c => posMap.has(c.id))
      
      if (visibleChildren.length > 0 && expandedNodes.has(pos.id)) {
        const spouse = getSpouses(pos.id)[0]
        const spousePos = spouse ? posMap.get(spouse.id) : null
        
        // Starting point (bottom of parent or couple center)
        let startX = pos.x + NODE_WIDTH / 2
        if (spousePos && pos.x < spousePos.x) {
          // Center between couple
          startX = (pos.x + NODE_WIDTH + spousePos.x) / 2
        }
        const startY = pos.y + NODE_HEIGHT
        
        // Get visible children positions
        const childPositions = visibleChildren
          .map(c => posMap.get(c.id))
          .filter((cp): cp is NodePosition => cp !== undefined)
        
        if (childPositions.length > 0) {
          const childY = childPositions[0].y
          const midY = (startY + childY) / 2
          
          // Vertical line down from parent(s)
          lines.push(
            <line
              key={`down-${pos.id}`}
              x1={startX}
              y1={startY}
              x2={startX}
              y2={midY}
              stroke="var(--primary)"
              strokeWidth="2"
              strokeOpacity="0.3"
            />
          )
          
          // Horizontal distribution bar if multiple children
          const leftX = Math.min(...childPositions.map(cp => cp.x + NODE_WIDTH / 2))
          const rightX = Math.max(...childPositions.map(cp => cp.x + NODE_WIDTH / 2))
          
          if (childPositions.length > 1) {
            lines.push(
              <line
                key={`bar-${pos.id}`}
                x1={leftX}
                y1={midY}
                x2={rightX}
                y2={midY}
                stroke="var(--primary)"
                strokeWidth="2"
                strokeOpacity="0.3"
              />
            )
          }
          
          // Lines to each child
          childPositions.forEach(cp => {
            lines.push(
              <line
                key={`child-${pos.id}-${cp.id}`}
                x1={cp.x + NODE_WIDTH / 2}
                y1={midY}
                x2={cp.x + NODE_WIDTH / 2}
                y2={cp.y}
                stroke="var(--primary)"
                strokeWidth="2"
                strokeOpacity="0.3"
              />
            )
          })
        }
      }
    })
    
    return lines
  }

  // Empty state
  if (members.length === 1 && self) {
    return (
      <div className="h-full bg-canvas canvas-pattern flex flex-col items-center justify-center p-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-full animate-pulse" style={{ margin: '-20px' }} />
          <TreeNode
            member={self}
            isSelf
            isNew={false}
            onTap={() => onViewMember(self)}
            onLongPress={(e) => handleNodeLongPress(self, e)}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-8 max-w-[200px]">
          Tap + atau tekan lama pada namamu untuk mulai.
        </p>
        
        <ZoomControls
          onFit={handleFitToScreen}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
        />
      </div>
    )
  }

  return (
    <div
      ref={canvasRef}
      className="h-full bg-canvas canvas-pattern overflow-hidden cursor-grab active:cursor-grabbing relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
    >
      {/* Canvas background for event capture */}
      <div className="canvas-bg absolute inset-0" />
      
      {/* Transformed content */}
      <div
        className="absolute transition-transform duration-75"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0'
        }}
      >
        {/* Connectors SVG layer */}
        <svg
          className="absolute pointer-events-none"
          style={{
            left: -1000,
            top: -500,
            width: 3000,
            height: 2000
          }}
        >
          <g transform="translate(1000, 500)">
            {renderConnectors()}
          </g>
        </svg>
        
        {/* Nodes */}
        {nodePositions.map(pos => {
          const member = members.find(m => m.id === pos.id)
          if (!member) return null
          
          const hasChildren = getChildren(pos.id).length > 0
          const isExpanded = expandedNodes.has(pos.id)
          
          return (
            <div
              key={pos.id}
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y
              }}
            >
              <TreeNode
                member={member}
                isSelf={member.isSelf}
                isNew={member.id === newNodeId}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                childCount={getChildren(pos.id).length}
                onTap={() => handleNodeTap(member)}
                onLongPress={(e) => handleNodeLongPress(member, e)}
                onToggleExpand={() => toggleExpand(pos.id)}
              />
            </div>
          )
        })}
      </div>

      {/* Quick Action Popup */}
      {quickAction && (
        <QuickActionPopup
          x={quickAction.x}
          y={quickAction.y}
          member={quickAction.member}
          onAction={handleQuickAction}
          onClose={() => setQuickAction(null)}
        />
      )}

      {/* Zoom Controls */}
      <ZoomControls
        onFit={handleFitToScreen}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
      />
    </div>
  )
}
