import type { Member } from './types'

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
    
    if (current.steps.length > 10) continue // Max depth increased
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
  
  if (pathStr === 'up') return isMale ? 'Ayah' : 'Ibu'
  if (pathStr === 'down') return isMale ? 'Anak laki-laki' : 'Anak perempuan'
  if (pathStr === 'lateral') return isMale ? 'Suami' : 'Istri'
  
  // === GRANDPARENTS/GRANDCHILDREN (2 steps) ===
  
  if (pathStr === 'up,up') return isMale ? 'Kakek' : 'Nenek'
  if (pathStr === 'down,down') return isMale ? 'Cucu laki-laki' : 'Cucu perempuan'
  
  // === SIBLINGS (2 steps via parent) ===
  
  if (pathStr === 'up,down') {
    const older = isOlder()
    if (older === true) return isMale ? 'Kakak laki-laki' : 'Kakak perempuan'
    if (older === false) return isMale ? 'Adik laki-laki' : 'Adik perempuan'
    return isMale ? 'Saudara laki-laki' : 'Saudara perempuan'
  }
  
  // === GREAT GRANDPARENTS/CHILDREN (3 steps) ===
  
  if (pathStr === 'up,up,up') return isMale ? 'Buyut (kakek)' : 'Buyut (nenek)'
  if (pathStr === 'down,down,down') return isMale ? 'Cicit laki-laki' : 'Cicit perempuan'
  
  // === GREAT-GREAT GRANDPARENTS/CHILDREN (4 steps) ===
  
  if (pathStr === 'up,up,up,up') return isMale ? 'Canggah (kakek)' : 'Canggah (nenek)'
  if (pathStr === 'down,down,down,down') return isMale ? 'Piut laki-laki' : 'Piut perempuan'
  
  // === IN-LAWS (Spouse's family) ===
  
  // Spouse's parent = Mertua
  if (pathStr === 'lateral,up') return isMale ? 'Ayah mertua' : 'Ibu mertua'
  
  // Spouse's grandparent
  if (pathStr === 'lateral,up,up') return isMale ? 'Kakek mertua' : 'Nenek mertua'
  
  // Spouse's sibling = Ipar
  if (pathStr === 'lateral,up,down') return isMale ? 'Ipar laki-laki' : 'Ipar perempuan'
  
  // Spouse's sibling's spouse = Ipar (also)
  if (pathStr === 'lateral,up,down,lateral') return isMale ? 'Ipar laki-laki' : 'Ipar perempuan'
  
  // Spouse's sibling's child = Keponakan ipar
  if (pathStr === 'lateral,up,down,down') return isMale ? 'Keponakan ipar laki-laki' : 'Keponakan ipar perempuan'
  
  // Spouse's uncle/aunt = Paman/Bibi mertua
  if (pathStr === 'lateral,up,up,down') return isMale ? 'Paman mertua' : 'Bibi mertua'
  
  // === IN-LAWS (Your family's spouses) ===
  
  // Child's spouse = Menantu
  if (pathStr === 'down,lateral') return isMale ? 'Menantu laki-laki' : 'Menantu perempuan'
  
  // Grandchild's spouse
  if (pathStr === 'down,down,lateral') return isMale ? 'Suami cucu' : 'Istri cucu'
  
  // Sibling's spouse = Ipar
  if (pathStr === 'up,down,lateral') return isMale ? 'Ipar laki-laki' : 'Ipar perempuan'
  
  // Parent's sibling's spouse = Paman/Bibi (by marriage)
  if (pathStr === 'up,up,down,lateral') return isMale ? 'Paman' : 'Bibi'
  
  // === BESAN (Co-parent-in-law) ===
  
  // Child's spouse's parent = Besan
  if (pathStr === 'down,lateral,up') return isMale ? 'Besan laki-laki' : 'Besan perempuan'
  
  // Child's spouse's grandparent
  if (pathStr === 'down,lateral,up,up') return isMale ? 'Orang tua besan laki-laki' : 'Orang tua besan perempuan'
  
  // Child's spouse's sibling
  if (pathStr === 'down,lateral,up,down') return isMale ? 'Adik/Kakak ipar menantu laki-laki' : 'Adik/Kakak ipar menantu perempuan'
  
  // === UNCLES/AUNTS & NEPHEWS/NIECES ===
  
  // Parent's sibling = Paman/Bibi
  if (pathStr === 'up,up,down') return isMale ? 'Paman' : 'Bibi'
  
  // Sibling's child = Keponakan
  if (pathStr === 'up,down,down') return isMale ? 'Keponakan laki-laki' : 'Keponakan perempuan'
  
  // Grandparent's sibling = Paman/Bibi buyut
  if (pathStr === 'up,up,up,down') return isMale ? 'Paman buyut' : 'Bibi buyut'
  
  // Sibling's grandchild = Cucu keponakan
  if (pathStr === 'up,down,down,down') return isMale ? 'Cucu keponakan laki-laki' : 'Cucu keponakan perempuan'
  
  // === COUSINS ===
  
  // Parent's sibling's child = Sepupu
  if (pathStr === 'up,up,down,down') return isMale ? 'Sepupu laki-laki' : 'Sepupu perempuan'
  
  // Parent's cousin = Sepupu orang tua
  if (pathStr === 'up,up,up,down,down') return isMale ? 'Sepupu ayah/ibu laki-laki' : 'Sepupu ayah/ibu perempuan'
  
  // Cousin's child = Anak sepupu / Keponakan sepupu
  if (pathStr === 'up,up,down,down,down') return isMale ? 'Anak sepupu laki-laki' : 'Anak sepupu perempuan'
  
  // Second cousin (parent's cousin's child)
  if (pathStr === 'up,up,up,down,down,down') return isMale ? 'Sepupu kedua laki-laki' : 'Sepupu kedua perempuan'
  
  // Cousin's spouse
  if (pathStr === 'up,up,down,down,lateral') return isMale ? 'Suami sepupu' : 'Istri sepupu'
  
  // === EXTENDED RELATIONSHIPS ===
  
  // Great uncle/aunt's child = Sepupu orang tua
  if (pathStr === 'up,up,up,down,down') return isMale ? 'Sepupu orang tua laki-laki' : 'Sepupu orang tua perempuan'
  
  // === ANALYZE PATH PATTERN FOR FALLBACK ===
  
  const upCount = path.filter(d => d === 'up').length
  const downCount = path.filter(d => d === 'down').length
  const lateralCount = path.filter(d => d === 'lateral').length
  
  // Through spouse (in-law family)
  if (lateralCount > 0) {
    // Path starts with lateral = spouse's family
    if (path[0] === 'lateral') {
      const relUpCount = path.slice(1).filter(d => d === 'up').length
      const relDownCount = path.slice(1).filter(d => d === 'down').length
      
      if (relUpCount > relDownCount) {
        const gen = relUpCount - relDownCount
        if (gen === 1) return isMale ? 'Keluarga mertua laki-laki' : 'Keluarga mertua perempuan'
        if (gen === 2) return isMale ? 'Keluarga kakek mertua laki-laki' : 'Keluarga nenek mertua perempuan'
        return isMale ? 'Keluarga mertua generasi atas' : 'Keluarga mertua generasi atas'
      }
      if (relDownCount > relUpCount) {
        return isMale ? 'Keluarga mertua generasi bawah laki-laki' : 'Keluarga mertua generasi bawah perempuan'
      }
      return isMale ? 'Keluarga mertua laki-laki' : 'Keluarga mertua perempuan'
    }
    
    // Path starts with down then lateral = child's in-law family (besan)
    if (path[0] === 'down' && path.includes('lateral')) {
      const lateralIdx = path.indexOf('lateral')
      if (lateralIdx > 0) {
        const afterLateral = path.slice(lateralIdx + 1)
        if (afterLateral.filter(d => d === 'up').length > 0) {
          return isMale ? 'Keluarga besan laki-laki' : 'Keluarga besan perempuan'
        }
        if (afterLateral.filter(d => d === 'down').length > 0) {
          return isMale ? 'Keluarga menantu laki-laki' : 'Keluarga menantu perempuan'
        }
      }
      return isMale ? 'Keluarga menantu laki-laki' : 'Keluarga menantu perempuan'
    }
    
    // Path ends with lateral = someone's spouse
    if (path[path.length - 1] === 'lateral') {
      const beforeLateral = path.slice(0, -1)
      const beforeUp = beforeLateral.filter(d => d === 'up').length
      const beforeDown = beforeLateral.filter(d => d === 'down').length
      
      if (beforeUp > beforeDown) {
        return isMale ? 'Suami kerabat' : 'Istri kerabat'
      }
      if (beforeDown > beforeUp) {
        return isMale ? 'Suami kerabat' : 'Istri kerabat'
      }
    }
    
    return isMale ? 'Kerabat laki-laki' : 'Kerabat perempuan'
  }
  
  // Blood relatives only
  if (upCount > downCount) {
    const diff = upCount - downCount
    if (diff === 1) {
      // Same generation as parents' siblings
      return isMale ? 'Sepupu orang tua laki-laki' : 'Sepupu orang tua perempuan'
    }
    if (diff === 2) {
      return isMale ? 'Sepupu kakek/nenek laki-laki' : 'Sepupu kakek/nenek perempuan'
    }
    return isMale ? 'Leluhur laki-laki' : 'Leluhur perempuan'
  }
  
  if (downCount > upCount) {
    const diff = downCount - upCount
    if (diff === 1) {
      return isMale ? 'Anak sepupu laki-laki' : 'Anak sepupu perempuan'
    }
    if (diff === 2) {
      return isMale ? 'Cucu sepupu laki-laki' : 'Cucu sepupu perempuan'
    }
    return isMale ? 'Keturunan laki-laki' : 'Keturunan perempuan'
  }
  
  // Same generation (upCount === downCount)
  if (upCount === downCount && upCount > 0) {
    if (upCount === 1) return isMale ? 'Saudara laki-laki' : 'Saudara perempuan'
    if (upCount === 2) return isMale ? 'Sepupu laki-laki' : 'Sepupu perempuan'
    if (upCount === 3) return isMale ? 'Sepupu kedua laki-laki' : 'Sepupu kedua perempuan'
    if (upCount === 4) return isMale ? 'Sepupu ketiga laki-laki' : 'Sepupu ketiga perempuan'
    return isMale ? 'Sepupu jauh laki-laki' : 'Sepupu jauh perempuan'
  }
  
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
  const conversions: Record<string, string> = {
    'Ayah': 'Ayahmu',
    'Ibu': 'Ibumu',
    'Suami': 'Suamimu',
    'Istri': 'Istrimu',
    'Kakek': 'Kakekmu',
    'Nenek': 'Nenekmu',
    'Paman': 'Pamanmu',
    'Bibi': 'Bibimu',
    'Ayah mertua': 'Ayah mertuamu',
    'Ibu mertua': 'Ibu mertuamu',
    'Kakek mertua': 'Kakek mertuamu',
    'Nenek mertua': 'Nenek mertuamu',
  }
  
  if (conversions[label]) return conversions[label]
  
  // Pattern-based conversions
  if (label.startsWith('Anak ')) return label.replace('Anak ', 'Anakmu ')
  if (label.startsWith('Cucu ')) return label.replace('Cucu ', 'Cucumu ')
  if (label.startsWith('Cicit ')) return label.replace('Cicit ', 'Cicitmu ')
  if (label.startsWith('Piut ')) return label.replace('Piut ', 'Piutmu ')
  if (label.startsWith('Kakak ')) return label.replace('Kakak ', 'Kakakmu ')
  if (label.startsWith('Adik ')) return label.replace('Adik ', 'Adikmu ')
  if (label.startsWith('Saudara ')) return label.replace('Saudara ', 'Saudaramu ')
  if (label.startsWith('Keponakan ')) return label.replace('Keponakan ', 'Keponakanmu ')
  if (label.startsWith('Sepupu ')) return label.replace('Sepupu ', 'Sepupumu ')
  if (label.startsWith('Menantu ')) return label.replace('Menantu ', 'Menantumu ')
  if (label.startsWith('Ipar ')) return label.replace('Ipar ', 'Iparmu ')
  if (label.startsWith('Besan ')) return label.replace('Besan ', 'Besanmu ')
  if (label.startsWith('Buyut ')) return label.replace('Buyut ', 'Buyutmu ')
  if (label.startsWith('Canggah ')) return label.replace('Canggah ', 'Canggahmu ')
  if (label.includes('sepupu')) return label.replace('sepupu', 'sepupumu')
  
  return label
}
