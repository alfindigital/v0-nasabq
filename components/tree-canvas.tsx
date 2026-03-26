'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useNasabStore } from '@/lib/store'
import type { Member } from '@/lib/types'
import { TreeNode } from './tree-node'
import { QuickActionPopup } from './quick-action-popup'
import { ZoomControls } from './zoom-controls'
import { getMahramStatus } from '@/lib/relationship'

interface TreeCanvasProps {
  onViewMember: (member: Member) => void
  onAddRelative: (context: { targetId: number; relationshipType: 'child' | 'parent' | 'spouse' }) => void
}

interface PositionedNode {
  id: number
  x: number
  y: number
  gen: number
}

interface Connection {
  type: 'spouse' | 'vertical' | 'horizontal' | 'parent-child'
  x1: number
  y1: number
  x2: number
  y2: number
  // For parent-child connections with multiple children
  childrenX?: number[]
  midY?: number
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
  const [dragTransformStart, setDragTransformStart] = useState({ x: 0, y: 0 })
  const [quickAction, setQuickAction] = useState<{ member: Member; x: number; y: number } | null>(null)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(new Set())
  const [initialized, setInitialized] = useState(false)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const { members, getParents, getChildren, getSpouses } = useNasabStore()
  const self = members.find(m => m.isSelf)

  /**
   * Build the tree layout with CORRECT hierarchy:
   * - ALL ancestors at TOP (grandparents, parents, in-laws' parents)
   * - Current generation in MIDDLE
   * - Descendants at BOTTOM
   * 
   * The key insight: generation is determined by DISTANCE from root ancestors,
   * not by traversal order. We need to find the oldest generation first.
   */
  const { positions, connections } = useMemo(() => {
    if (!self || members.length === 0) return { positions: [], connections: [] }
    
    const nodePositions: PositionedNode[] = []
    const lines: Connection[] = []
    
    // Step 1: Build adjacency for parent-child relationships only
    const parentOf = new Map<number, Set<number>>() // parentOf.get(childId) = set of parent IDs
    const childOf = new Map<number, Set<number>>() // childOf.get(parentId) = set of child IDs
    const spouseOf = new Map<number, Set<number>>() // spouseOf.get(id) = set of spouse IDs
    
    members.forEach(m => {
      parentOf.set(m.id, new Set())
      childOf.set(m.id, new Set())
      spouseOf.set(m.id, new Set())
    })
    
    members.forEach(m => {
      m.relationships.forEach(r => {
        if (r.type === 'parent') {
          parentOf.get(m.id)?.add(r.targetId)
          childOf.get(r.targetId)?.add(m.id)
        } else if (r.type === 'child') {
          childOf.get(m.id)?.add(r.targetId)
          parentOf.get(r.targetId)?.add(m.id)
        } else if (r.type === 'spouse') {
          spouseOf.get(m.id)?.add(r.targetId)
          spouseOf.get(r.targetId)?.add(m.id)
        }
      })
    })
    
    // Step 2: Find all root ancestors (people with no parents)
    const roots = members.filter(m => (parentOf.get(m.id)?.size || 0) === 0)
    
    // Step 3: Assign generations using BFS from roots (oldest = 0, increasing downward)
    const memberGen = new Map<number, number>()
    
    // BFS from all roots simultaneously
    const queue: { id: number; gen: number }[] = []
    roots.forEach(r => queue.push({ id: r.id, gen: 0 }))
    
    while (queue.length > 0) {
      const { id, gen } = queue.shift()!
      
      // Skip if already assigned (take the minimum/oldest generation)
      if (memberGen.has(id) && memberGen.get(id)! <= gen) continue
      memberGen.set(id, gen)
      
      // Process children (they are one generation below)
      const children = childOf.get(id) || new Set()
      children.forEach(childId => {
        if (!memberGen.has(childId) || memberGen.get(childId)! > gen + 1) {
          queue.push({ id: childId, gen: gen + 1 })
        }
      })
    }
    
    // Step 4: Handle disconnected members (assign based on spouse if possible)
    members.forEach(m => {
      if (!memberGen.has(m.id)) {
        // Try to get generation from spouse
        const spouses = spouseOf.get(m.id) || new Set()
        for (const spouseId of spouses) {
          if (memberGen.has(spouseId)) {
            memberGen.set(m.id, memberGen.get(spouseId)!)
            break
          }
        }
        // If still not assigned, check if any children have generation
        const children = childOf.get(m.id) || new Set()
        for (const childId of children) {
          if (memberGen.has(childId)) {
            memberGen.set(m.id, memberGen.get(childId)! - 1)
            break
          }
        }
        // Default to 0 if completely disconnected
        if (!memberGen.has(m.id)) {
          memberGen.set(m.id, 0)
        }
      }
    })
    
    // Step 5: Ensure spouses are at the same generation (take the MINIMUM)
    let changed = true
    while (changed) {
      changed = false
      members.forEach(m => {
        const spouses = spouseOf.get(m.id) || new Set()
        spouses.forEach(spouseId => {
          const myGen = memberGen.get(m.id)!
          const spouseGen = memberGen.get(spouseId)!
          if (myGen !== spouseGen) {
            const minGen = Math.min(myGen, spouseGen)
            if (memberGen.get(m.id) !== minGen) {
              memberGen.set(m.id, minGen)
              changed = true
            }
            if (memberGen.get(spouseId) !== minGen) {
              memberGen.set(spouseId, minGen)
              changed = true
            }
          }
        })
      })
    }
    
    // Step 6: Verify parent-child relationship (parent must be above child)
    // If not, adjust the parent upward
    changed = true
    while (changed) {
      changed = false
      members.forEach(m => {
        const parents = parentOf.get(m.id) || new Set()
        const myGen = memberGen.get(m.id)!
        parents.forEach(parentId => {
          const parentGen = memberGen.get(parentId)!
          if (parentGen >= myGen) {
            // Parent should be ABOVE (lower gen number)
            memberGen.set(parentId, myGen - 1)
            // Also adjust parent's spouses
            const parentSpouses = spouseOf.get(parentId) || new Set()
            parentSpouses.forEach(psId => {
              memberGen.set(psId, myGen - 1)
            })
            changed = true
          }
        })
      })
    }
    
    // Step 7: Normalize generations (make minimum = 0)
    const minGen = Math.min(...Array.from(memberGen.values()))
    if (minGen !== 0) {
      members.forEach(m => {
        memberGen.set(m.id, memberGen.get(m.id)! - minGen)
      })
    }
    
    // Step 8: Determine visibility (collapse logic)
    const isVisible = new Map<number, boolean>()
    
    const checkVisibility = (id: number): boolean => {
      // Check if any ancestor is collapsed
      const parents = parentOf.get(id) || new Set()
      for (const parentId of parents) {
        if (collapsedNodes.has(parentId)) return false
        // Check parent's spouses too
        const parentSpouses = spouseOf.get(parentId) || new Set()
        for (const psId of parentSpouses) {
          if (collapsedNodes.has(psId)) return false
        }
        // Recursively check if parent is visible
        if (!checkVisibility(parentId)) return false
      }
      return true
    }
    
    members.forEach(m => {
      isVisible.set(m.id, checkVisibility(m.id))
    })
    
    // Step 9: Group by generation and position
    const genGroups = new Map<number, number[]>()
    members.forEach(m => {
      if (!isVisible.get(m.id)) return
      const gen = memberGen.get(m.id)!
      if (!genGroups.has(gen)) genGroups.set(gen, [])
      genGroups.get(gen)!.push(m.id)
    })
    
    const sortedGens = Array.from(genGroups.keys()).sort((a, b) => a - b)
    const positioned = new Map<number, PositionedNode>()
    
    // Position each generation
    sortedGens.forEach(gen => {
      const memberIds = genGroups.get(gen) || []
      const genY = gen * (NODE_HEIGHT + V_GAP)
      
      // Group couples together
      const processed = new Set<number>()
      const couples: number[][] = []
      
      // Sort members by their connection to already-positioned parents
      const sortedIds = [...memberIds].sort((a, b) => {
        // Self comes first
        if (a === self.id) return -1
        if (b === self.id) return 1
        
        // Sort by parent position if available
        const parentsA = Array.from(parentOf.get(a) || [])
        const parentsB = Array.from(parentOf.get(b) || [])
        const parentPosA = parentsA.map(p => positioned.get(p)?.x || 0)
        const parentPosB = parentsB.map(p => positioned.get(p)?.x || 0)
        const avgA = parentPosA.length > 0 ? parentPosA.reduce((s, x) => s + x, 0) / parentPosA.length : 0
        const avgB = parentPosB.length > 0 ? parentPosB.reduce((s, x) => s + x, 0) / parentPosB.length : 0
        return avgA - avgB
      })
      
      sortedIds.forEach(id => {
        if (processed.has(id)) return
        
        const couple = [id]
        processed.add(id)
        
        // Add spouses
        const spouses = spouseOf.get(id) || new Set()
        spouses.forEach(spouseId => {
          if (!processed.has(spouseId) && memberGen.get(spouseId) === gen && isVisible.get(spouseId)) {
            couple.push(spouseId)
            processed.add(spouseId)
          }
        })
        
        couples.push(couple)
      })
      
      // Calculate total width
      let totalWidth = 0
      couples.forEach((couple, i) => {
        totalWidth += couple.length * NODE_WIDTH + (couple.length - 1) * SPOUSE_GAP
        if (i < couples.length - 1) totalWidth += H_GAP
      })
      
      // Position centered
      let currentX = -totalWidth / 2
      
      couples.forEach(couple => {
        couple.forEach((id, idx) => {
          const pos: PositionedNode = { id, x: currentX, y: genY, gen }
          nodePositions.push(pos)
          positioned.set(id, pos)
          currentX += NODE_WIDTH + (idx < couple.length - 1 ? SPOUSE_GAP : 0)
        })
        currentX += H_GAP
      })
    })
    
    // Step 10: Draw connections
    const drawnConnections = new Set<string>()
    console.log('[v0] childOf map:', Array.from(childOf.entries()).map(([k, v]) => [members.find(m => m.id === k)?.name, Array.from(v).map(cid => members.find(m => m.id === cid)?.name)]))
    console.log('[v0] positioned members:', Array.from(positioned.keys()).map(id => members.find(m => m.id === id)?.name))
    
    nodePositions.forEach(pos => {
      // Spouse connections (horizontal with heart)
      const spouses = spouseOf.get(pos.id) || new Set()
      spouses.forEach(spouseId => {
        const spousePos = positioned.get(spouseId)
        if (!spousePos || spousePos.y !== pos.y) return
        
        const key = [pos.id, spouseId].sort().join('-s-')
        if (drawnConnections.has(key)) return
        drawnConnections.add(key)
        
        const leftX = Math.min(pos.x, spousePos.x) + NODE_WIDTH
        const rightX = Math.max(pos.x, spousePos.x)
        const y = pos.y + NODE_HEIGHT / 2
        
        lines.push({ type: 'spouse', x1: leftX, y1: y, x2: rightX, y2: y })
      })
      
      // Skip children connections if collapsed
      if (collapsedNodes.has(pos.id)) {
        console.log('[v0] Skipping collapsed node:', member?.name)
        return
      }
      
      // Parent-to-children connections
      const children = childOf.get(pos.id) || new Set()
      const visibleChildIds = Array.from(children).filter(cid => positioned.has(cid))
      
      const member = members.find(m => m.id === pos.id)
      const childrenNames = Array.from(children).map(cid => members.find(m => m.id === cid)?.name)
      const visibleChildNames = visibleChildIds.map(cid => members.find(m => m.id === cid)?.name)
      console.log('[v0] Checking parent:', member?.name, 'children:', childrenNames, 'positioned children:', visibleChildNames)
      
      if (visibleChildIds.length === 0) return
      
      // Find couple at this position
      const coupleIds = [pos.id]
      spouses.forEach(spouseId => {
        const sp = positioned.get(spouseId)
        if (sp && sp.y === pos.y) {
          // Check if spouse is also parent of these children
          const spouseChildren = childOf.get(spouseId) || new Set()
          if (visibleChildIds.some(cid => spouseChildren.has(cid))) {
            coupleIds.push(spouseId)
          }
        }
      })
      
      const connKey = `p-${coupleIds.sort().join(',')}-c-${visibleChildIds.sort().join(',')}`
      if (drawnConnections.has(connKey)) return
      drawnConnections.add(connKey)
      
      // Parent center point
      const couplePositions = coupleIds.map(id => positioned.get(id)!).filter(Boolean)
      const coupleMinX = Math.min(...couplePositions.map(p => p.x))
      const coupleMaxX = Math.max(...couplePositions.map(p => p.x)) + NODE_WIDTH
      const parentCenterX = (coupleMinX + coupleMaxX) / 2
      const parentBottomY = pos.y + NODE_HEIGHT
      
      // Child positions
      const childPositions = visibleChildIds
        .map(cid => positioned.get(cid))
        .filter((p): p is PositionedNode => p !== undefined)
        .sort((a, b) => a.x - b.x)
      
      if (childPositions.length === 0) return
      
      const midY = parentBottomY + V_GAP / 2
      const childrenX = childPositions.map(cp => cp.x + NODE_WIDTH / 2)
      const childY = childPositions[0].y
      
      // Single parent-child connection object with all children
      console.log('[v0] Creating connection:', member?.name, '-> children at X:', childrenX, 'parentCenterX:', parentCenterX, 'midY:', midY, 'childY:', childY)
      lines.push({
        type: 'parent-child',
        x1: parentCenterX,
        y1: parentBottomY,
        x2: parentCenterX,
        y2: childY,
        childrenX,
        midY
      })
    })
    
    return { positions: nodePositions, connections: lines }
  }, [members, self, collapsedNodes])

  // Fit to screen
  const handleFitToScreen = useCallback(() => {
    if (!canvasRef.current || positions.length === 0) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const minX = Math.min(...positions.map(p => p.x))
    const maxX = Math.max(...positions.map(p => p.x)) + NODE_WIDTH
    const minY = Math.min(...positions.map(p => p.y))
    const maxY = Math.max(...positions.map(p => p.y)) + NODE_HEIGHT
    
    const treeWidth = maxX - minX + 100
    const treeHeight = maxY - minY + 100
    
    const scaleX = rect.width / treeWidth
    const scaleY = rect.height / treeHeight
    const scale = Math.min(scaleX, scaleY, 1.2)
    
    setTransform({
      x: rect.width / 2 - ((minX + maxX) / 2) * scale,
      y: rect.height / 2 - ((minY + maxY) / 2) * scale,
      scale: Math.max(0.4, Math.min(scale, 1.2))
    })
  }, [positions])

  // Initialize
  useEffect(() => {
    if (self && !initialized && positions.length > 0) {
      setTimeout(handleFitToScreen, 100)
      setInitialized(true)
    }
  }, [self, initialized, positions.length, handleFitToScreen])

  useEffect(() => {
    if (initialized) handleFitToScreen()
  }, [members.length])

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.tree-node, .quick-action, .zoom-controls')) return
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setDragTransformStart({ x: transform.x, y: transform.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setTransform(t => ({
      ...t,
      x: dragTransformStart.x + (e.clientX - dragStart.x),
      y: dragTransformStart.y + (e.clientY - dragStart.y)
    }))
  }

  const handleMouseUp = () => setIsDragging(false)

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
    setTransform(t => ({
      ...t,
      x: dragTransformStart.x + (e.touches[0].clientX - dragStart.x),
      y: dragTransformStart.y + (e.touches[0].clientY - dragStart.y)
    }))
  }

  const handleTouchEnd = () => setIsDragging(false)

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setTransform(t => ({ ...t, scale: Math.min(2, Math.max(0.3, t.scale + delta)) }))
  }

  const handleZoomIn = () => setTransform(t => ({ ...t, scale: Math.min(2, t.scale + 0.2) }))
  const handleZoomOut = () => setTransform(t => ({ ...t, scale: Math.max(0.3, t.scale - 0.2) }))

  const toggleCollapse = (id: number) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleAll = () => {
    const nodesWithChildren = members.filter(m => getChildren(m.id).length > 0).map(m => m.id)
    // Check if currently expanded (no collapsed nodes or only self is not collapsed)
    const isExpanded = collapsedNodes.size === 0
    if (isExpanded) {
      // Collapse all nodes with children (except self to keep tree visible)
      const toCollapse = nodesWithChildren.filter(id => id !== self?.id)
      setCollapsedNodes(new Set(toCollapse))
    } else {
      // Expand all - clear collapsed nodes
      setCollapsedNodes(new Set())
    }
    // Fit to screen after toggle
    setTimeout(handleFitToScreen, 100)
  }

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
    if (action === 'edit') onViewMember(quickAction.member)
    else onAddRelative({ targetId: quickAction.member.id, relationshipType: action })
    setQuickAction(null)
  }

  if (members.length === 1 && self) {
    return (
      <div className="h-full bg-canvas canvas-pattern flex flex-col items-center justify-center p-6 text-center">
        <TreeNode
          member={self}
          isSelf
          isNew={false}
          mahramStatus="self"
          onTap={() => onViewMember(self)}
          onLongPress={(e) => handleNodeLongPress(self, e)}
        />
        <p className="text-sm text-muted-foreground mt-6 max-w-[200px]">
          Tap untuk mulai menambah keluarga
        </p>
        <ZoomControls
          onFit={handleFitToScreen}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleFitToScreen}
          onToggleAll={handleToggleAll}
          isAllExpanded={collapsedNodes.size === 0}
          members={members}
          onSelectMember={onViewMember}
        />
      </div>
    )
  }

  return (
    <div
      ref={canvasRef}
      data-tree-canvas
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
        <svg
          className="absolute pointer-events-none"
          style={{ left: -2000, top: -1000, width: 5000, height: 3000 }}
        >
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <g transform="translate(2000, 1000)">
            {console.log('[v0] Rendering connections:', connections.length, connections)}
            {connections.map((conn, i) => {
              if (conn.type === 'spouse') {
                // Spouse connection: curved line with heart marker
                const midX = (conn.x1 + conn.x2) / 2
                return (
                  <g key={i}>
                    <path
                      d={`M ${conn.x1} ${conn.y1} Q ${midX} ${conn.y1 - 8} ${conn.x2} ${conn.y2}`}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      strokeOpacity={0.5}
                      strokeLinecap="round"
                    />
                    <circle
                      cx={midX}
                      cy={conn.y1 - 4}
                      r={5}
                      fill="var(--primary)"
                      fillOpacity={0.6}
                    />
                  </g>
                )
              }
              
              if (conn.type === 'parent-child' && conn.childrenX && conn.midY) {
                // Parent to children: smooth curved connections
                const { x1, y1, childrenX, midY, y2 } = conn
                const curveRadius = 12
                
                return (
                  <g key={i}>
                    {childrenX.map((childX, ci) => {
                      const horizontalDiff = Math.abs(childX - x1)
                      const isStraight = horizontalDiff < 20
                      
                      if (isStraight) {
                        // Straight vertical line (or nearly straight)
                        const midPointX = (x1 + childX) / 2
                        return (
                          <path
                            key={ci}
                            d={`M ${x1} ${y1} L ${midPointX} ${midY} L ${childX} ${y2}`}
                            fill="none"
                            stroke="url(#lineGradient)"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )
                      }
                      
                      // Curved path for children that are offset horizontally
                      const isRight = childX > x1
                      const curveDir = isRight ? 1 : -1
                      
                      // Create smooth path with rounded corners
                      const path = `
                        M ${x1} ${y1}
                        L ${x1} ${midY - curveRadius}
                        Q ${x1} ${midY}, ${x1 + curveRadius * curveDir} ${midY}
                        L ${childX - curveRadius * curveDir} ${midY}
                        Q ${childX} ${midY}, ${childX} ${midY + curveRadius}
                        L ${childX} ${y2}
                      `
                      
                      return (
                        <path
                          key={ci}
                          d={path}
                          fill="none"
                          stroke="url(#lineGradient)"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )
                    })}
                  </g>
                )
              }
              
              return null
            })}
          </g>
        </svg>

        {positions.map(pos => {
          const member = members.find(m => m.id === pos.id)
          if (!member) return null
          
          const childCount = getChildren(pos.id).length
          const isCollapsed = collapsedNodes.has(pos.id)
          
          // Calculate mahram status from self's perspective
          const mahramStatus = self ? getMahramStatus(
            self.id,
            member.id,
            self.gender,
            member,
            members,
            getParents,
            getChildren,
            getSpouses
          ) : undefined

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
                mahramStatus={mahramStatus}
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
            member={quickAction.member}
            x={quickAction.x}
            y={quickAction.y}
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
        members={members}
        onSelectMember={onViewMember}
      />
    </div>
  )
}
