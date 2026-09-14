import { z } from 'zod'
import {
  byIdSchema,
  calendarDateSchema,
  idSchema,
  optionalText,
  updateSchema,
} from './common.schema.ts'

/** Schema của nhóm kênh `family-member:*`. */

/** Chín giá trị quan hệ đã chốt — `project/database-schema.md` §2.5. */
export const relationshipSchema = z.enum(
  [
    'head',
    'spouse',
    'child',
    'parent',
    'grandparent',
    'grandchild',
    'sibling',
    'relative',
    'other',
  ],
  { error: 'Quan hệ với chủ hộ không hợp lệ' },
)

export const familyMemberAddSchema = z
  .object(
    {
      familyId: idSchema,
      personId: idSchema,
      relationship: relationshipSchema,
      fromDate: calendarDateSchema,
      note: optionalText(2000, 'Ghi chú'),
    },
    { error: 'Dữ liệu thành viên hộ không hợp lệ' },
  )
  .strict()

export const familyMemberUpdateSchema = updateSchema(
  z
    .object({
      relationship: relationshipSchema.optional(),
      note: optionalText(2000, 'Ghi chú'),
    })
    .strict(),
  'thành viên hộ',
)

/**
 * Chuyển hộ là **một** thao tác nghiệp vụ, không phải `update` — nó đóng một dòng và mở
 * một dòng khác trong cùng transaction.
 */
export const familyMemberMoveSchema = z
  .object(
    {
      personId: idSchema,
      toFamilyId: idSchema,
      relationship: relationshipSchema,
      moveDate: calendarDateSchema,
    },
    { error: 'Dữ liệu chuyển hộ không hợp lệ' },
  )
  .strict()

export const familyMemberRemoveSchema = byIdSchema('thành viên hộ')
