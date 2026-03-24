import type { Member, Gender } from './types'

type Direction = 'up' | 'down' | 'lateral'

interface PathResult {
  path: Direction[]
  members: Member[]
}

// BFS to find shortest path between two members
export function findPath(
  fromId: number,
  toId: number,
  members: Member[],
  getParents: (id: number) => Member[],
  getChildren: (id: number) => Member[],
  getSpouses: (id: number) => Member[]
): PathResult | null {
  if (fromId === toId) return { path: [], members: [] }
  
  const visited = new Set<number>()
  const queue: { id: number; path: Direction[]; memberPath: Member[] }[] = [
    { id: fromId, path: [], memberPath: [] }
  ]
  
  while (queue.length > 0) {
    const current = queue.shift()!
    
    if (current.path.length > 7) continue // Max depth
    if (visited.has(current.id)) continue
    visited.add(current.id)
    
    // Check parents (up)
    for (const parent of getParents(current.id)) {
      if (parent.id === toId) {
        return { path: [...current.path, 'up'], members: [...current.memberPath, parent] }
      }
      if (!visited.has(parent.id)) {
        queue.push({ 
          id: parent.id, 
          path: [...current.path, 'up'],
          memberPath: [...current.memberPath, parent]
        })
      }
    }
    
    // Check children (down)
    for (const child of getChildren(current.id)) {
      if (child.id === toId) {
        return { path: [...current.path, 'down'], members: [...current.memberPath, child] }
      }
      if (!visited.has(child.id)) {
        queue.push({ 
          id: child.id, 
          path: [...current.path, 'down'],
          memberPath: [...current.memberPath, child]
        })
      }
    }
    
    // Check spouses (lateral)
    for (const spouse of getSpouses(current.id)) {
      if (spouse.id === toId) {
        return { path: [...current.path, 'lateral'], members: [...current.memberPath, spouse] }
      }
      if (!visited.has(spouse.id)) {
        queue.push({ 
          id: spouse.id, 
          path: [...current.path, 'lateral'],
          memberPath: [...current.memberPath, spouse]
        })
      }
    }
  }
  
  return null
}

// Decode path to relationship label
export function pathToLabel(
  path: Direction[],
  targetGender: Gender,
  fromMember: Member | undefined,
  targetMember: Member | undefined
): string {
  const pathStr = path.join(',')
  const isMale = targetGender === 'M'
  
  // Helper to compare birth years for sibling age
  const isOlder = (target: Member | undefined, from: Member | undefined): boolean | null => {
    if (!target?.birthYear || !from?.birthYear) return null
    return target.birthYear < from.birthYear
  }
  
  // Direct relationships
  if (pathStr === 'up') return isMale ? 'Ayah' : 'Ibu'
  if (pathStr === 'down') return isMale ? 'Anak laki-laki' : 'Anak perempuan'
  if (pathStr === 'lateral') return isMale ? 'Suami' : 'Istri'
  
  // Grandparents/grandchildren
  if (pathStr === 'up,up') return isMale ? 'Kakek' : 'Nenek'
  if (pathStr === 'down,down') return isMale ? 'Cucu laki-laki' : 'Cucu perempuan'
  if (pathStr === 'up,up,up') return 'Buyut'
  if (pathStr === 'down,down,down') return 'Cicit'
  
  // Siblings (up then down to different person)
  if (pathStr === 'up,down') {
    const older = isOlder(targetMember, fromMember)
    if (older === true) return isMale ? 'Kakak laki-laki' : 'Kakak perempuan'
    if (older === false) return isMale ? 'Adik laki-laki' : 'Adik perempuan'
    return isMale ? 'Saudara laki-laki' : 'Saudara perempuan'
  }
  
  // In-laws
  if (pathStr === 'lateral,up') return isMale ? 'Ayah mertua' : 'Ibu mertua'
  if (pathStr === 'down,lateral') return isMale ? 'Menantu laki-laki' : 'Menantu perempuan'
  
  // Siblings-in-law (spouse's sibling or sibling's spouse)
  if (pathStr === 'lateral,up,down' || pathStr === 'up,down,lateral') {
    const older = isOlder(targetMember, fromMember)
    if (older === true) return isMale ? 'Kakak ipar laki-laki' : 'Kakak ipar perempuan'
    if (older === false) return isMale ? 'Adik ipar laki-laki' : 'Adik ipar perempuan'
    return isMale ? 'Ipar laki-laki' : 'Ipar perempuan'
  }
  
  // Besan (child's spouse's parent)
  if (pathStr === 'down,lateral,up') return isMale ? 'Besan laki-laki' : 'Besan perempuan'
  
  // Uncle/Aunt (parent's sibling)
  if (pathStr === 'up,up,down') {
    const parentSibling = targetMember
    const parent = fromMember ? undefined : undefined // Would need actual parent reference
    const older = isOlder(parentSibling, parent)
    if (older === true) return isMale ? 'Pakde' : 'Bude'
    if (older === false) return isMale ? 'Om' : 'Tante'
    return isMale ? 'Paman' : 'Bibi'
  }
  
  // Nephew/Niece (sibling's child)
  if (pathStr === 'up,down,down') return isMale ? 'Keponakan laki-laki' : 'Keponakan perempuan'
  
  // Cousin
  if (pathStr === 'up,up,down,down') return isMale ? 'Sepupu laki-laki' : 'Sepupu perempuan'
  
  // Spouse's grandparent
  if (pathStr === 'lateral,up,up') return isMale ? 'Kakek mertua' : 'Nenek mertua'
  
  // Spouse's uncle/aunt
  if (pathStr === 'lateral,up,up,down') return isMale ? 'Paman pasangan' : 'Bibi pasangan'
  
  // Spouse's niece/nephew
  if (pathStr === 'lateral,up,down,down') return isMale ? 'Keponakan ipar laki-laki' : 'Keponakan ipar perempuan'
  
  // Spouse's cousin
  if (pathStr === 'lateral,up,up,down,down') return isMale ? 'Sepupu ipar laki-laki' : 'Sepupu ipar perempuan'
  
  // Fallback for longer paths
  if (path.length > 5) return 'Kerabat jauh'
  
  return 'Kerabat'
}

// Get relationship explanation path
export function getPathExplanation(members: Member[], path: Direction[]): string {
  if (members.length === 0) return ''
  
  const parts: string[] = []
  for (let i = 0; i < members.length; i++) {
    const member = members[i]
    const direction = path[i]
    const dirLabel = direction === 'up' ? 'orang tua' : 
                     direction === 'down' ? 'anak' : 
                     'pasangan'
    parts.push(`${dirLabel} ${member.name}`)
  }
  
  return `(${parts.join(', ')})`
}

// Get relationship label from one member to another
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
  
  const result = findPath(fromId, toId, members, getParents, getChildren, getSpouses)
  
  if (!result) {
    return { label: 'Tidak terhubung', explanation: 'Tambahkan data penghubung.' }
  }
  
  const label = pathToLabel(result.path, to.gender, from, to)
  const explanation = getPathExplanation(result.members, result.path)
  
  return { label, explanation }
}

// Get simple label for display in cards (relationship to self)
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
  
  // Convert to possessive form
  const label = result.label
  if (label === 'Ayah') return 'Ayahmu'
  if (label === 'Ibu') return 'Ibumu'
  if (label === 'Suami') return 'Suamimu'
  if (label === 'Istri') return 'Istrimu'
  if (label.includes('Anak')) return label.replace('Anak', 'Anakmu')
  if (label.includes('Kakak')) return label.replace('Kakak', 'Kakakmu')
  if (label.includes('Adik')) return label.replace('Adik', 'Adikmu')
  if (label.includes('Saudara')) return label.replace('Saudara', 'Saudaramu')
  if (label.includes('Kakek')) return 'Kakekmu'
  if (label.includes('Nenek')) return 'Nenekmu'
  if (label.includes('Cucu')) return label.replace('Cucu', 'Cucumu')
  if (label.includes('mertua')) return label
  if (label.includes('ipar')) return label
  if (label.includes('Paman') || label === 'Om' || label === 'Pakde') return 'Pamanmu'
  if (label.includes('Bibi') || label === 'Tante' || label === 'Bude') return 'Bibimu'
  if (label.includes('Keponakan')) return label.replace('Keponakan', 'Keponakanmu')
  if (label.includes('Sepupu')) return label.replace('Sepupu', 'Sepupumu')
  
  return label
}
