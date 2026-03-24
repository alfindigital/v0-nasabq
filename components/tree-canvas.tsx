'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNasabStore } from '@/lib/store'
import type { Member } from '@/lib/types'
import { TreeNode } from './tree-node'
import { QuickActionPopup } from './quick-action-popup'
import { ZoomControls } from './zoom-controls'
import { Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface TreeCanvasProps {
  onViewMember: (member: Member) => void
  onAddRelative: (context: { targetId: number; relationshipType: 'child' | 'parent' | 'spouse' | 'sibling' }) => void
}

interface NodePosition {
  id: number
  x: number
  y: number
  generation: number
  spouseId?: number
}

export function TreeCanvas({ onViewMember, onAddRelative }: TreeCanvasProps) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [quickAction, setQuickAction] = useState<{ member: Member; x: number; y: number } | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [newNodeId, setNewNodeId] = useState<number | null>(null)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  
  const { members, getParents, getChildren, getSpouses } = useNasabStore()
  const self = members.find(m => m.isSelf)

  // Build tree structure and calculate positions
  const nodePositions = useMemo(() => {
    if (!self) return []
    
    const positions: NodePosition[] = []
    const visited = new Set<number>()
    const NODE_WIDTH = 160
    const NODE_HEIGHT = 46
    const H_GAP = 80
    const V_GAP = 120
    const SPOUSE_GAP = 20

    // Get generation for a member (relative to self)
    const getGeneration = (id: number, from: number, visited: Set<number>): number => {
      if (visited.has(id)) return 0
      if (id === from) return 0
      visited.add(id)
      
      const member = members.find(m => m.id === id)
      if (!member) return 0
      
      // Check if parent of from
      const fromMember = members.find(m => m.id === from)
      if (fromMember?.relationships.some(r => r.type === 'parent' && r.targetId === id)) {
        return -1
      }
      // Check if child of from
      if (fromMember?.relationships.some(r => r.type === 'child' && r.targetId === id)) {
        return 1
      }
      
      return 0
    }

    // Calculate generations by traversing from self
    const memberGenerations = new Map<number, number>()
    
    const calculateGenerations = (id: number, gen: number, visited: Set<number>) => {
      if (visited.has(id)) return
      visited.add(id)
      memberGenerations.set(id, gen)
      
      const parents = getParents(id)
      parents.forEach(p => calculateGenerations(p.id, gen - 1, visited))
      
      const children = getChildren(id)
      children.forEach(c => calculateGenerations(c.id, gen + 1, visited))
      
      const spouses = getSpouses(id)
      spouses.forEach(s => {
        if (!visited.has(s.id)) {
          memberGenerations.set(s.id, gen)
          visited.add(s.id)
        }
      })
    }
    
    calculateGenerations(self.id, 0, new Set())

    // Group by generation
    const generations = new Map<number, Member[]>()
    members.forEach(m => {
      const gen = memberGenerations.get(m.id) ?? 0
      if (!generations.has(gen)) generations.set(gen, [])
      generations.get(gen)!.push(m)
    })

    // Position nodes by generation
    const sortedGens = Array.from(generations.keys()).sort((a, b) => a - b)
    
    sortedGens.forEach(gen => {
      const genMembers = generations.get(gen)!
      const processedInGen = new Set<number>()
      let xOffset = 0
      
      // Group spouses together
      genMembers.forEach(member => {
        if (processedInGen.has(member.id)) return
        
        const spouses = getSpouses(member.id).filter(s => memberGenerations.get(s.id) === gen)
        
        // Position member
        positions.push({
          id: member.id,
          x: xOffset,
          y: gen * (NODE_HEIGHT + V_GAP),
          generation: gen,
          spouseId: spouses[0]?.id
        })
        processedInGen.add(member.id)
        xOffset += NODE_WIDTH + H_GAP
        
        // Position spouse next to member
        spouses.forEach(spouse => {
          if (!processedInGen.has(spouse.id)) {
            positions.push({
              id: spouse.id,
              x: xOffset - H_GAP + SPOUSE_GAP,
              y: gen * (NODE_HEIGHT + V_GAP),
              generation: gen,
              spouseId: member.id
            })
            processedInGen.add(spouse.id)
            xOffset += NODE_WIDTH + SPOUSE_GAP
          }
        })
      })
    })

    // Center horizontally
    const minX = Math.min(...positions.map(p => p.x))
    const maxX = Math.max(...positions.map(p => p.x))
    const centerX = (minX + maxX) / 2
    positions.forEach(p => p.x -= centerX)

    return positions
  }, [members, self, getParents, getChildren, getSpouses])

  // Expand first 2 generations by default
  useEffect(() => {
    if (self) {
      const toExpand = new Set<number>()
      const addWithChildren = (id: number, depth: number) => {
        if (depth > 2) return
        toExpand.add(id)
        getChildren(id).forEach(c => addWithChildren(c.id, depth + 1))
      }
      addWithChildren(self.id, 0)
      // Also expand parents
      getParents(self.id).forEach(p => toExpand.add(p.id))
      setExpandedNodes(toExpand)
    }
  }, [self?.id])

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
    const maxX = Math.max(...nodePositions.map(p => p.x)) + 160
    const minY = Math.min(...nodePositions.map(p => p.y))
    const maxY = Math.max(...nodePositions.map(p => p.y)) + 46
    
    const treeWidth = maxX - minX + 80
    const treeHeight = maxY - minY + 80
    
    const scale = Math.min(
      rect.width / treeWidth,
      rect.height / treeHeight,
      1.5
    )
    
    setTransform({
      x: rect.width / 2,
      y: rect.height / 2 - (minY + maxY) / 2 * scale,
      scale: Math.max(0.3, Math.min(scale, 1.5))
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
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Check if node should be visible based on expanded state
  const isNodeVisible = (id: number): boolean => {
    if (!self) return false
    if (id === self.id) return true
    
    const parents = getParents(id)
    // If any parent is expanded, show this node
    return parents.some(p => expandedNodes.has(p.id)) || 
           getSpouses(id).some(s => parents.some(p => expandedNodes.has(p.id)))
  }

  // Generate connector lines SVG
  const renderConnectors = () => {
    const lines: JSX.Element[] = []
    const posMap = new Map(nodePositions.map(p => [p.id, p]))
    
    nodePositions.forEach(pos => {
      const member = members.find(m => m.id === pos.id)
      if (!member) return
      
      // Spouse connector
      if (pos.spouseId) {
        const spousePos = posMap.get(pos.spouseId)
        if (spousePos && pos.x < spousePos.x) {
          const midX = (pos.x + spousePos.x + 160) / 2
          const y = pos.y + 23
          lines.push(
            <g key={`spouse-${pos.id}-${pos.spouseId}`}>
              <line
                x1={pos.x + 160}
                y1={y}
                x2={spousePos.x}
                y2={y}
                stroke="var(--primary)"
                strokeWidth="2"
                strokeOpacity="0.2"
              />
              <circle
                cx={midX}
                cy={y}
                r="4"
                fill="var(--primary)"
                fillOpacity="0.3"
              />
            </g>
          )
        }
      }
      
      // Parent-child connectors
      const children = getChildren(pos.id)
      if (children.length > 0 && expandedNodes.has(pos.id)) {
        const spouse = getSpouses(pos.id)[0]
        const spousePos = spouse ? posMap.get(spouse.id) : null
        
        // Starting point (bottom of parent or couple)
        let startX = pos.x + 80
        if (spousePos && pos.x < spousePos.x) {
          startX = (pos.x + spousePos.x + 160) / 2
        }
        const startY = pos.y + 46
        
        // Get visible children positions
        const childPositions = children
          .map(c => posMap.get(c.id))
          .filter((cp): cp is NodePosition => cp !== undefined)
        
        if (childPositions.length > 0) {
          const childY = childPositions[0].y
          const midY = (startY + childY) / 2
          
          // Vertical line down from parent
          lines.push(
            <line
              key={`down-${pos.id}`}
              x1={startX}
              y1={startY}
              x2={startX}
              y2={midY}
              stroke="var(--primary)"
              strokeWidth="2"
              strokeOpacity="0.2"
            />
          )
          
          // Horizontal distribution bar
          const leftX = Math.min(...childPositions.map(cp => cp.x + 80))
          const rightX = Math.max(...childPositions.map(cp => cp.x + 80))
          
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
                strokeOpacity="0.2"
              />
            )
          }
          
          // Lines to each child
          childPositions.forEach(cp => {
            lines.push(
              <line
                key={`child-${pos.id}-${cp.id}`}
                x1={cp.x + 80}
                y1={midY}
                x2={cp.x + 80}
                y2={cp.y}
                stroke="var(--primary)"
                strokeWidth="2"
                strokeOpacity="0.2"
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
      <div className="h-full bg-canvas flex flex-col items-center justify-center p-6 text-center">
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
        
        {/* Zoom controls still visible */}
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
