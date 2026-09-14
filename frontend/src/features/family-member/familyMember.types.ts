export type Relationship =
  | 'head'
  | 'spouse'
  | 'child'
  | 'parent'
  | 'grandparent'
  | 'grandchild'
  | 'sibling'
  | 'relative'
  | 'other'

export type FamilyMember = {
  id: string
  familyId: string
  personId: string
  relationship: Relationship
  fromDate: string
  toDate: string | null
  personFullName?: string
  personHolyName?: string | null
  personBirthDate?: string | null
  familyName?: string
  updatedAt: string
}

export type PersonChoice = { id: string; fullName: string; familyName?: string | null }
export type FamilyChoice = { id: string; name: string }

export const relationshipOptions: ReadonlyArray<readonly [Relationship, string]> = [
  ['head', 'Chủ hộ'],
  ['spouse', 'Vợ/chồng'],
  ['child', 'Con'],
  ['parent', 'Cha/mẹ'],
  ['grandparent', 'Ông/bà'],
  ['grandchild', 'Cháu'],
  ['sibling', 'Anh/chị/em'],
  ['relative', 'Họ hàng'],
  ['other', 'Khác'],
]

export const relationshipLabel = (relationship: Relationship) =>
  relationshipOptions.find(([value]) => value === relationship)?.[1] ?? relationship
