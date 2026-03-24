import type { Member, Gender } from './types'

type Direction = 'up' | 'down' | 'lateral'

interface PathStep {
  direction: Direction
  member: Member
}

interface PathResult {
  steps: PathStep[]
}

/**
 * BFS to find shortest relationship path between two members.
 * - 'up' = move to parent
 * - 'down' = move to child  
 * - 'lateral' = move to spouse
 * 
 * The path represents how to go FROM person A TO person B.
 */
export function findPath(
  fromId: number,
  toId: number,
  members: Member[],
  getParents: (id: number) => Member[],
  getChildren: (id: number) => Member[],
  getSpouses: (id: number) => Member[]
): PathResult | null {
  if (fromId === toId) return { steps: [] }
  
  const visited = new Set<number>()
  const queue: { id: number; steps: PathStep[] }[] = [
    { id: fromId, steps: [] }
  ]
  
  while (queue.length > 0) {
    const current = queue.shift()!
    
    if (current.steps.length > 8) continue // Max depth
    if (visited.has(current.id)) continue
    visited.add(current.id)
    
    // Check parents (going UP means target is an ancestor)
    for (const parent of getParents(current.id)) {
      if (parent.id === toId) {
        return { steps: [...current.steps, { direction: 'up', member: parent }] }
      }
      if (!visited.has(parent.id)) {
        queue.push({ 
          id: parent.id, 
          steps: [...current.steps, { direction: 'up', member: parent }]
        })
      }
    }
    
    // Check children (going DOWN means target is a descendant)
    for (const child of getChildren(current.id)) {
      if (child.id === toId) {
        return { steps: [...current.steps, { direction: 'down', member: child }] }
      }
      if (!visited.has(child.id)) {
        queue.push({ 
          id: child.id, 
          steps: [...current.steps, { direction: 'down', member: child }]
        })
      }
    }
    
    // Check spouses (lateral connection)
    for (const spouse of getSpouses(current.id)) {
      if (spouse.id === toId) {
        return { steps: [...current.steps, { direction: 'lateral', member: spouse }] }
      }
      if (!visited.has(spouse.id)) {
        queue.push({ 
          id: spouse.id, 
          steps: [...current.steps, { direction: 'lateral', member: spouse }]
        })
      }
    }
  }
  
  return null
}

/**
 * Convert a path to a human-readable relationship label.
 * The path goes from FROM to TO, so:
 * - If path is ['up'], it means TO is the parent of FROM
 * - If path is ['down'], it means TO is the child of FROM
 * - etc.
 */
export function pathToLabel(
  steps: PathStep[],
  targetMember: Member,
  fromMember: Member
): string {
  if (steps.length === 0) return 'Diri sendiri'
  
  const path = steps.map(s => s.direction)
  const pathStr = path.join(',')
  const isMale = targetMember.gender === 'M'
  
  // Helper to compare birth years for sibling age
  const isOlder = (): boolean | null => {
    if (!targetMember.birthYear || !fromMember.birthYear) return null
    return targetMember.birthYear < fromMember.birthYear
  }
  
  // === DIRECT RELATIONSHIPS (1 step) ===
  
  // 'up' = I went to my parent, so target is my PARENT
  if (pathStr === 'up') return isMale ? 'Ayah' : 'Ibu'
  
  // 'down' = I went to my child, so target is my CHILD
  if (pathStr === 'down') return isMale ? 'Anak laki-laki' : 'Anak perempuan'
  
  // 'lateral' = I went to my spouse, so target is my SPOUSE
  if (pathStr === 'lateral') return isMale ? 'Suami' : 'Istri'
  
  // === GRANDPARENTS/GRANDCHILDREN (2 steps) ===
  
  // 'up,up' = parent's parent = GRANDPARENT
  if (pathStr === 'up,up') return isMale ? 'Kakek' : 'Nenek'
  
  // 'down,down' = child's child = GRANDCHILD
  if (pathStr === 'down,down') return isMale ? 'Cucu laki-laki' : 'Cucu perempuan'
  
  // === SIBLINGS (2 steps via parent) ===
  
  // 'up,down' = parent's child (not me) = SIBLING
  if (pathStr === 'up,down') {
    const older = isOlder()
    if (older === true) return isMale ? 'Kakak laki-laki' : 'Kakak perempuan'
    if (older === false) return isMale ? 'Adik laki-laki' : 'Adik perempuan'
    return isMale ? 'Saudara laki-laki' : 'Saudara perempuan'
  }
  
  // === GREAT GRANDPARENTS/CHILDREN (3 steps) ===
  
  if (pathStr === 'up,up,up') return isMale ? 'Buyut (kakek)' : 'Buyut (nenek)'
  if (pathStr === 'down,down,down') return isMale ? 'Cicit laki-laki' : 'Cicit perempuan'
  
  // === IN-LAWS ===
  
  // 'lateral,up' = spouse's parent = PARENT-IN-LAW (Mertua)
  if (pathStr === 'lateral,up') return isMale ? 'Ayah mertua' : 'Ibu mertua'
  
  // 'down,lateral' = child's spouse = CHILD-IN-LAW (Menantu)
  if (pathStr === 'down,lateral') return isMale ? 'Menantu laki-laki' : 'Menantu perempuan'
  
  // 'lateral,up,down' = spouse's sibling = SIBLING-IN-LAW (Ipar)
  if (pathStr === 'lateral,up,down') return isMale ? 'Ipar laki-laki' : 'Ipar perempuan'
  
  // 'up,down,lateral' = sibling's spouse = SIBLING-IN-LAW (Ipar)
  if (pathStr === 'up,down,lateral') return isMale ? 'Ipar laki-laki' : 'Ipar perempuan'
  
  // 'down,lateral,up' = child's spouse's parent = CO-PARENT-IN-LAW (Besan)
  if (pathStr === 'down,lateral,up') return isMale ? 'Besan (laki-laki)' : 'Besan (perempuan)'
  
  // === UNCLES/AUNTS & NEPHEWS/NIECES ===
  
  // 'up,up,down' = parent's sibling = UNCLE/AUNT
  if (pathStr === 'up,up,down') return isMale ? 'Paman' : 'Bibi'
  
  // 'up,down,down' = sibling's child = NEPHEW/NIECE
  if (pathStr === 'up,down,down') return isMale ? 'Keponakan laki-laki' : 'Keponakan perempuan'
  
  // === COUSINS ===
  
  // 'up,up,down,down' = parent's sibling's child = COUSIN
  if (pathStr === 'up,up,down,down') return isMale ? 'Sepupu laki-laki' : 'Sepupu perempuan'
  
  // === EXTENDED IN-LAWS ===
  
  // Spouse's grandparents
  if (pathStr === 'lateral,up,up') return isMale ? 'Kakek mertua' : 'Nenek mertua'
  
  // Spouse's uncle/aunt
  if (pathStr === 'lateral,up,up,down') return isMale ? 'Paman mertua' : 'Bibi mertua'
  
  // Grandchild's spouse
  if (pathStr === 'down,down,lateral') return isMale ? 'Suami cucu' : 'Istri cucu'
  
  // Child-in-law's sibling (ipar from menantu)
  if (pathStr === 'down,lateral,up,down') return isMale ? 'Ipar menantu (laki-laki)' : 'Ipar menantu (perempuan)'
  
  // Child-in-law's parent's other children (besan's other kids)
  if (pathStr === 'down,lateral,up,down') return isMale ? 'Anak besan laki-laki' : 'Anak besan perempuan'
  
  // Great uncle/aunt
  if (pathStr === 'up,up,up,down') return isMale ? 'Paman buyut' : 'Bibi buyut'
  
  // Great nephew/niece
  if (pathStr === 'up,down,down,down') return isMale ? 'Cicit keponakan laki-laki' : 'Cicit keponakan perempuan'
  
  // Second cousin (parent's cousin's child)
  if (pathStr === 'up,up,up,down,down') return isMale ? 'Sepupu jauh laki-laki' : 'Sepupu jauh perempuan'
  if (pathStr === 'up,up,down,down,down') return isMale ? 'Anak sepupu laki-laki' : 'Anak sepupu perempuan'
  
  // === FALLBACK BASED ON PATTERN ANALYSIS ===
  
  const upCount = path.filter(d => d === 'up').length
  const downCount = path.filter(d => d === 'down').length
  const lateralCount = path.filter(d => d === 'lateral').length
  
  // Through marriage
  if (lateralCount > 0) {
    if (path[0] === 'lateral') {
      // Starting with spouse = spouse's family
      if (upCount > downCount) return isMale ? 'Keluarga mertua (laki-laki)' : 'Keluarga mertua (perempuan)'
      if (downCount > upCount) return isMale ? 'Keluarga mertua (laki-laki)' : 'Keluarga mertua (perempuan)'
      return 'Keluarga mertua'
    }
    if (path[path.length - 1] === 'lateral') {
      // Ending with spouse = someone's spouse
      return isMale ? 'Keluarga besan laki-laki' : 'Keluarga besan perempuan'
    }
    return 'Kerabat melalui pernikahan'
  }
  
  // Blood relatives
  if (upCount > downCount) {
    const diff = upCount - downCount
    if (diff === 1) return isMale ? 'Paman/Sepupu tua laki-laki' : 'Bibi/Sepupu tua perempuan'
    if (diff === 2) return isMale ? 'Kerabat generasi atas (laki-laki)' : 'Kerabat generasi atas (perempuan)'
    return 'Leluhur'
  }
  
  if (downCount > upCount) {
    const diff = downCount - upCount
    if (diff === 1) return isMale ? 'Keponakan/Sepupu muda laki-laki' : 'Keponakan/Sepupu muda perempuan'
    if (diff === 2) return isMale ? 'Kerabat generasi bawah (laki-laki)' : 'Kerabat generasi bawah (perempuan)'
    return 'Keturunan'
  }
  
  // Same generation
  return isMale ? 'Kerabat laki-laki' : 'Kerabat perempuan'
}

/**
 * Get the relationship label from one member to another.
 * Returns what toMember is TO fromMember.
 */
export function getRelationshipLabel(
  fromId: number,
  toId: number,
  members: Member[],
  getParents: (id: number) => Member[],
  getChildren: (id: number) => Member[],
  getSpouses: (id: number) => Member[]
): { label: string; explanation: string } {
  const from = members.find(m => m.id === fromId)
  const to = members.find(m => m.id === toId)
  
  if (!from || !to) {
    return { label: 'Tidak terhubung', explanation: '' }
  }
  
  if (fromId === toId) {
    return { label: 'Diri sendiri', explanation: '' }
  }
  
  const result = findPath(fromId, toId, members, getParents, getChildren, getSpouses)
  
  if (!result) {
    return { label: 'Tidak terhubung', explanation: '' }
  }
  
  const label = pathToLabel(result.steps, to, from)
  
  return { label, explanation: '' }
}

/**
 * Get simple relationship label for display (with possessive form)
 */
export function getRelationToSelf(
  memberId: number,
  selfId: number,
  members: Member[],
  getParents: (id: number) => Member[],
  getChildren: (id: number) => Member[],
  getSpouses: (id: number) => Member[]
): string {
  if (memberId === selfId) return 'Kamu'
  
  const result = getRelationshipLabel(selfId, memberId, members, getParents, getChildren, getSpouses)
  const label = result.label
  
  if (label === 'Tidak terhubung') return ''
  
  // Convert to possessive Indonesian form
  if (label === 'Ayah') return 'Ayahmu'
  if (label === 'Ibu') return 'Ibumu'
  if (label === 'Suami') return 'Suamimu'
  if (label === 'Istri') return 'Istrimu'
  if (label === 'Kakek') return 'Kakekmu'
  if (label === 'Nenek') return 'Nenekmu'
  if (label === 'Paman') return 'Pamanmu'
  if (label === 'Bibi') return 'Bibimu'
  if (label.startsWith('Anak')) return label.replace('Anak', 'Anakmu')
  if (label.startsWith('Cucu')) return label.replace('Cucu', 'Cucumu')
  if (label.startsWith('Cicit')) return label.replace('Cicit', 'Cicitmu')
  if (label.startsWith('Kakak')) return label.replace('Kakak', 'Kakakmu')
  if (label.startsWith('Adik')) return label.replace('Adik', 'Adikmu')
  if (label.startsWith('Saudara')) return label.replace('Saudara', 'Saudaramu')
  if (label.startsWith('Keponakan')) return label.replace('Keponakan', 'Keponakanmu')
  if (label.startsWith('Sepupu')) return label.replace('Sepupu', 'Sepupumu')
  if (label.includes('mertua')) return label
  if (label.includes('Menantu')) return label.replace('Menantu', 'Menantumu')
  if (label.includes('Ipar')) return label.replace('Ipar', 'Iparmu')
  if (label.includes('Besan')) return label.replace('Besan', 'Besanmu')
  if (label.includes('Buyut')) return label.replace('Buyut', 'Buyutmu')
  
  return label
}
