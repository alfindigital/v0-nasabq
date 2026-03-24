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
  spouseId?: number
  isSpouse?: boolean
}

export function TreeCanvas({ onViewMember, onAddRelative }: TreeCanvasProps) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [lastTransform, setLastTransform] = useState({ x: 0, y: 0 })
  const [quickAction, setQuickAction] = useState<{ member: Member; x: number; y: number } | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [newNodeId, setNewNodeId] = useState<number | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [prevMemberCount, setPrevMemberCount] = useState(0)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  
  const { members, getParents, getChildren, getSpouses } = useNasabStore()
  const self = members.find(m => m.isSelf)

  // Constants for layout
  const NODE_WIDTH = 140
  const NODE_HEIGHT = 46
  const H_GAP = 60 // Horizontal gap between unrelated nodes
  const V_GAP = 80 // Vertical gap between generations
  const SPOUSE_GAP = 20 // Small gap between spouses (horizontal)

  // Build tree structure and calculate positions
  // CORRECT: Parents (negative generation) at TOP, Children (positive generation) at BOTTOM
  const nodePositions = useMemo(() => {
    if (!self) return []
    
    const positions: NodePosition[] = []
    const processedIds = new Set<number>()

    // Calculate generations: self = 0, parents = -1, children = +1
    // Negative gen = ancestors (top), Positive gen = descendants (bottom)
    const memberGenerations = new Map<number, number>()
    
    const calculateGenerations = (id: number, gen: number, visited: Set<number>) => {
      if (visited.has(id)) return
      visited.add(id)
      
      const currentGen = memberGenerations.get(id)
      // For ancestors (going up), we want the lowest (most negative) gen
      // For descendants (going down), we want the highest (most positive) gen
      if (currentGen !== undefined) {
        if (gen < 0 && currentGen <= gen) return // Already have more ancestral
        if (gen > 0 && currentGen >= gen) return // Already have more descendant
        if (gen === 0 && currentGen !== undefined) return // Already set at base
      }
      
      memberGenerations.set(id, gen)
      
      // Parents are ABOVE (gen - 1 = more negative = higher up visually)
      const parents = getParents(id)
      parents.forEach(p => calculateGenerations(p.id, gen - 1, new Set(visited)))
      
      // Children are BELOW (gen + 1 = more positive = lower down visually)
      const children = getChildren(id)
      children.forEach(c => calculateGenerations(c.id, gen + 1, new Set(visited)))
      
      // Spouses are on same level
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

    // Sort generations: negative (ancestors) first, then 0 (self), then positive (descendants)
    // This means the SMALLEST number is at the TOP
    const sortedGens = Array.from(generations.keys()).sort((a, b) => a - b)
    const minGen = sortedGens.length > 0 ? sortedGens[0] : 0
    
    // Position nodes by generation
    sortedGens.forEach((gen, genIndex) => {
      const genMembers = generations.get(gen)!
      const processedInGen = new Set<number>()
      let xOffset = 0
      
      // Sort to prioritize self
      const sortedMembers = [...genMembers].sort((a, b) => {
        if (a.isSelf) return -1
        if (b.isSelf) return 1
        return 0
      })

      // Group spouses together horizontally
      sortedMembers.forEach(member => {
        if (processedInGen.has(member.id)) return
        
        const spouses = getSpouses(member.id).filter(s => memberGenerations.get(s.id) === gen)
        
        // Check visibility based on expanded state
        const isVisible = expandedNodes.size === 0 || 
                          member.isSelf || 
                          expandedNodes.has(member.id) ||
                          getParents(member.id).some(p => expandedNodes.has(p.id)) ||
                          spouses.some(s => getParents(s.id).some(p => expandedNodes.has(p.id)))

        if (!isVisible && gen !== 0) return

        // Y position: genIndex determines vertical position
        // TOP of tree is genIndex=0 (ancestors), BOTTOM is highest genIndex (descendants)
        const yPos = genIndex * (NODE_HEIGHT + V_GAP)

        // Position member
        positions.push({
          id: member.id,
          x: xOffset,
          y: yPos,
          generation: gen,
          spouseId: spouses[0]?.id,
          isSpouse: false
        })
        processedInGen.add(member.id)
        processedIds.add(member.id)
        
        // Position spouse(s) horizontally next to member
        spouses.forEach(spouse => {
          if (!processedInGen.has(spouse.id)) {
            xOffset += NODE_WIDTH + SPOUSE_GAP
            positions.push({
              id: spouse.id,
              x: xOffset,
              y: yPos,
              generation: gen,
              spouseId: member.id,
              isSpouse: true
            })
            processedInGen.add(spouse.id)
            processedIds.add(spouse.id)
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
      setPrevMemberCount(members.length)
    }
  }, [self, members, initialized])

  // Auto-fit and center
  const handleFitToScreen = useCallback(() => {
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
    
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    
    const newTransform = {
      x: rect.width / 2 - centerX * scale,
      y: rect.height / 2 - centerY * scale,
      scale: Math.max(0.4, Math.min(scale, 1.2))
    }
    
    setTransform(newTransform)
    setLastTransform({ x: newTransform.x, y: newTransform.y })
  }, [nodePositions])

  // Initial fit
  useEffect(() => {
    if (initialized && nodePositions.length > 0 && canvasRef.current) {
      handleFitToScreen()
    }
  }, [initialized, handleFitToScreen])

  // Detect new member and expand + mark
  useEffect(() => {
    if (members.length > prevMemberCount && prevMemberCount > 0) {
      const newMember = members[members.length - 1]
      if (newMember) {
        setNewNodeId(newMember.id)
        setExpandedNodes(prev => new Set([...prev, newMember.id]))
      }
    }
    setPrevMemberCount(members.length)
  }, [members.length, prevMemberCount, members])

  // Clear new node highlight after animation
  useEffect(() => {
    if (newNodeId !== null) {
      const timer = setTimeout(() => setNewNodeId(null), 1500)
      return () => clearTimeout(timer)
    }
  }, [newNodeId])

  // Pan handlers - smooth dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.tree-node') || target.closest('.quick-action')) return
    
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setLastTransform({ x: transform.x, y: transform.y })
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      setTransform(t => ({ 
        ...t, 
        x: lastTransform.x + dx, 
        y: lastTransform.y + dy 
      }))
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setLastTransform({ x: transform.x, y: transform.y })
    }
    setIsDragging(false)
  }

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.tree-node') || target.closest('.quick-action')) return
    
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      setIsDragging(true)
      setDragStart({ x: touch.clientX, y: touch.clientY })
      setLastTransform({ x: transform.x, y: transform.y })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0]
      const dx = touch.clientX - dragStart.x
      const dy = touch.clientY - dragStart.y
      setTransform(t => ({ 
        ...t, 
        x: lastTransform.x + dx, 
        y: lastTransform.y + dy 
      }))
    }
  }

  const handleTouchEnd = () => {
    if (isDragging) {
      setLastTransform({ x: transform.x, y: transform.y })
    }
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
    const target = e.target as HTMLElement
    if (target.closest('.tree-node')) return
    handleFitToScreen()
  }

  // Zoom controls
  const handleZoomIn = () => setTransform(t => ({ ...t, scale: Math.min(2, t.scale + 0.2) }))
  const handleZoomOut = () => setTransform(t => ({ ...t, scale: Math.max(0.3, t.scale - 0.2) }))
  const handleReset = () => handleFitToScreen()

  // Node interactions
  const handleNodeTap = (member: Member) => {
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
        const descendants = getChildren(id)
        descendants.forEach(d => next.delete(d.id))
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Toggle all expand/collapse
  const handleToggleAll = () => {
    if (expandedNodes.size === members.length) {
      setExpandedNodes(new Set(self ? [self.id] : []))
    } else {
      setExpandedNodes(new Set(members.map(m => m.id)))
    }
  }

  // Generate connector lines SVG
  // Lines go DOWN from parents to children
  const renderConnectors = () => {
    const lines: JSX.Element[] = []
    const posMap = new Map(nodePositions.map(p => [p.id, p]))
    const processedChildConnections = new Set<string>()
    
    nodePositions.forEach(pos => {
      const member = members.find(m => m.id === pos.id)
      if (!member) return
      
      // Spouse connector (horizontal line between spouses)
      if (pos.spouseId && !pos.isSpouse) {
        const spousePos = posMap.get(pos.spouseId)
        if (spousePos) {
          const y = pos.y + NODE_HEIGHT / 2
          const x1 = pos.x + NODE_WIDTH
          const x2 = spousePos.x
          const midX = (x1 + x2) / 2
          
          lines.push(
            <g key={`spouse-${pos.id}-${pos.spouseId}`}>
              <line
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke="var(--primary)"
                strokeWidth="2"
                strokeOpacity="0.6"
              />
              <circle
                cx={midX}
                cy={y}
                r="4"
                fill="var(--primary)"
                fillOpacity="0.7"
              />
            </g>
          )
        }
      }
      
      // Parent to child connectors (lines going DOWN)
      // Only draw if this node is NOT a spouse (to avoid duplicate lines)
      if (!pos.isSpouse) {
        const children = getChildren(pos.id)
        const spouse = getSpouses(pos.id)[0]
        const spousePos = spouse ? posMap.get(spouse.id) : null
        
        // Combine children from both spouses if applicable
        let allChildren = [...children]
        if (spouse) {
          const spouseChildren = getChildren(spouse.id)
          spouseChildren.forEach(sc => {
            if (!allChildren.some(c => c.id === sc.id)) {
              allChildren.push(sc)
            }
          })
        }
        
        const visibleChildren = allChildren.filter(c => {
          const key = `${Math.min(pos.id, c.id)}-${Math.max(pos.id, c.id)}`
          if (processedChildConnections.has(key)) return false
          return posMap.has(c.id)
        })
        
        if (visibleChildren.length > 0 && expandedNodes.has(pos.id)) {
          // Starting point (bottom center of parent, or center between couple)
          let startX = pos.x + NODE_WIDTH / 2
          if (spousePos) {
            startX = (pos.x + NODE_WIDTH + spousePos.x) / 2
          }
          const startY = pos.y + NODE_HEIGHT
          
          // Get visible children positions
          const childPositions = visibleChildren
            .map(c => posMap.get(c.id))
            .filter((cp): cp is NodePosition => cp !== undefined)
            .sort((a, b) => a.x - b.x)
          
          if (childPositions.length > 0) {
            const childY = childPositions[0].y
            const midY = startY + (childY - startY) / 2
            
            // Vertical line down from parent(s) to midpoint
            lines.push(
              <line
                key={`down-${pos.id}`}
                x1={startX}
                y1={startY}
                x2={startX}
                y2={midY}
                stroke="var(--primary)"
                strokeWidth="2"
                strokeOpacity="0.4"
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
                  strokeOpacity="0.4"
                />
              )
              
              // Connect startX to the bar if needed
              if (startX < leftX) {
                lines.push(
                  <line
                    key={`connect-l-${pos.id}`}
                    x1={startX}
                    y1={midY}
                    x2={leftX}
                    y2={midY}
                    stroke="var(--primary)"
                    strokeWidth="2"
                    strokeOpacity="0.4"
                  />
                )
              } else if (startX > rightX) {
                lines.push(
                  <line
                    key={`connect-r-${pos.id}`}
                    x1={startX}
                    y1={midY}
                    x2={rightX}
                    y2={midY}
                    stroke="var(--primary)"
                    strokeWidth="2"
                    strokeOpacity="0.4"
                  />
                )
              }
            }
            
            // Lines from midpoint down to each child
            childPositions.forEach(cp => {
              const key = `${Math.min(pos.id, cp.id)}-${Math.max(pos.id, cp.id)}`
              processedChildConnections.add(key)
              
              lines.push(
                <line
                  key={`child-${pos.id}-${cp.id}`}
                  x1={cp.x + NODE_WIDTH / 2}
                  y1={midY}
                  x2={cp.x + NODE_WIDTH / 2}
                  y2={cp.y}
                  stroke="var(--primary)"
                  strokeWidth="2"
                  strokeOpacity="0.4"
                />
              )
            })
          }
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
          onToggleAll={handleToggleAll}
          isAllExpanded={expandedNodes.size === members.length}
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
      onDoubleClick={handleDoubleClick}
    >
      {/* Transformed content */}
      <div
        className="absolute"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out'
        }}
      >
        {/* Connectors SVG layer */}
        <svg
          className="absolute pointer-events-none"
          style={{
            left: -2000,
            top: -1000,
            width: 5000,
            height: 3000
          }}
        >
          <g transform="translate(2000, 1000)">
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
              className="absolute tree-node"
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

      {/* Zoom Controls */}
      <ZoomControls
        onFit={handleFitToScreen}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onToggleAll={handleToggleAll}
        isAllExpanded={expandedNodes.size === members.length}
      />
    </div>
  )
}
