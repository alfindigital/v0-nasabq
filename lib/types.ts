export type Gender = 'M' | 'F'

export type RelationshipType = 'spouse' | 'child' | 'parent'

export interface Relationship {
  type: RelationshipType
  targetId: number
}

export interface Member {
  id: number
  name: string
  nickname: string | null
  gender: Gender
  birthYear: number | null
  birthPlace: string | null
  isDeceased: boolean
  deathYear: number | null
  deathPlace: string | null
  address: string | null
  notes: string | null
  isSelf: boolean
  relationships: Relationship[]
  createdAt: number
}

export interface NasabData {
  members: Member[]
  nextId: number
  settings: {
    darkMode: boolean
  }
}

export type ViewType = 'tree' | 'list' | 'relationship' | 'search'

export type RelationshipLabel = 
  | 'Ayah' | 'Ibu' 
  | 'Anak laki-laki' | 'Anak perempuan' 
  | 'Suami' | 'Istri'
  | 'Kakek' | 'Nenek' | 'Buyut'
  | 'Cucu laki-laki' | 'Cucu perempuan' | 'Cicit'
  | 'Kakak laki-laki' | 'Kakak perempuan' | 'Adik laki-laki' | 'Adik perempuan' 
  | 'Saudara laki-laki' | 'Saudara perempuan'
  | 'Ayah mertua' | 'Ibu mertua'
  | 'Menantu laki-laki' | 'Menantu perempuan'
  | 'Kakak ipar laki-laki' | 'Kakak ipar perempuan' | 'Adik ipar laki-laki' | 'Adik ipar perempuan' | 'Ipar laki-laki' | 'Ipar perempuan'
  | 'Besan laki-laki' | 'Besan perempuan'
  | 'Pakde' | 'Bude' | 'Om' | 'Tante' | 'Paman' | 'Bibi'
  | 'Keponakan laki-laki' | 'Keponakan perempuan'
  | 'Sepupu laki-laki' | 'Sepupu perempuan'
  | 'Kerabat jauh'
  | 'Tidak terhubung'
