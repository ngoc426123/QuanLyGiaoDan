import { useMemo, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { DateInput } from '@/components/ui/DateInput.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { AppClientError } from '@/shared/invoke.ts'
import {
  relationshipOptions,
  type FamilyChoice,
  type PersonChoice,
  type Relationship,
} from '../familyMember.types.ts'
import styles from './FamilyMember.module.css'

type AddValue = { personId: string; relationship: Relationship; fromDate: string }
type MoveValue = { toFamilyId: string; relationship: Relationship; moveDate: string }
type FormValue = AddValue & Partial<MoveValue>

type Props = {
  people?: PersonChoice[]
  families?: FamilyChoice[]
  initialValue?: Partial<FormValue>
  onSubmit: (value: AddValue | MoveValue) => Promise<unknown>
  isPending: boolean
  mode?: 'add' | 'move'
  showHeadWarning?: boolean
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()

const messageFor = (error: AppClientError) => {
  if (error.code !== 'CONFLICT') return error.message
  if ((error.details as { currentMembership?: unknown } | undefined)?.currentMembership)
    return 'Giáo dân này đã thuộc một hộ khác. Hãy dùng chức năng chuyển hộ.'
  if ((error.details as { currentHead?: unknown } | undefined)?.currentHead)
    return 'Hộ đích đã có chủ hộ. Hãy chọn quan hệ khác hoặc đổi chủ hộ hiện tại.'
  return error.message
}

export function FamilyMemberForm({
  people = [],
  families = [],
  initialValue = {},
  onSubmit,
  isPending,
  mode = 'add',
  showHeadWarning = false,
}: Props) {
  const [value, setValue] = useState<FormValue>({
    personId: '',
    relationship: 'other',
    fromDate: '',
    toFamilyId: '',
    moveDate: '',
    ...initialValue,
  })
  const [search, setSearch] = useState('')
  const [error, setError] = useState<AppClientError | null>(null)
  const visibleFamilies = useMemo(
    () => families.filter((family) => normalize(family.name).includes(normalize(search))),
    [families, search],
  )
  const fieldErrors = (error?.details as { fieldErrors?: Record<string, string> } | undefined)
    ?.fieldErrors

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    try {
      if (mode === 'move') {
        await onSubmit({
          toFamilyId: value.toFamilyId ?? '',
          relationship: value.relationship,
          moveDate: value.moveDate ?? '',
        })
      } else {
        await onSubmit({
          personId: value.personId,
          relationship: value.relationship,
          fromDate: value.fromDate,
        })
      }
    } catch (nextError) {
      setError(nextError instanceof AppClientError ? nextError : null)
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      {mode === 'add' && (
        <Select
          label="Giáo dân"
          value={value.personId}
          error={fieldErrors?.personId}
          onChange={(event) => setValue({ ...value, personId: event.target.value })}
          required
        >
          <option value="">Chọn giáo dân</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.fullName}
              {person.familyName ? ` (${person.familyName})` : ''}
            </option>
          ))}
        </Select>
      )}
      {mode === 'move' && (
        <>
          {showHeadWarning && (
            <p className={styles.warning}>
              Người này đang là chủ hộ. Sau khi chuyển, hộ cũ sẽ không còn chủ hộ.
            </p>
          )}
          <Input
            label="Tìm hộ đích"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            label="Hộ đích"
            value={value.toFamilyId ?? ''}
            error={fieldErrors?.toFamilyId}
            onChange={(event) => setValue({ ...value, toFamilyId: event.target.value })}
            required
          >
            <option value="">Chọn hộ đích</option>
            {visibleFamilies.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </Select>
          {search && visibleFamilies.length === 0 && (
            <p className={styles.hint}>Không tìm thấy hộ đích phù hợp.</p>
          )}
        </>
      )}
      <Select
        label="Quan hệ"
        value={value.relationship}
        error={fieldErrors?.relationship}
        onChange={(event) =>
          setValue({ ...value, relationship: event.target.value as Relationship })
        }
        required
      >
        {relationshipOptions.map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </Select>
      {mode === 'add' ? (
        <DateInput
          label="Ngày vào hộ"
          value={value.fromDate}
          error={fieldErrors?.fromDate}
          onChange={(fromDate: string) => setValue({ ...value, fromDate })}
          required
        />
      ) : (
        <DateInput
          label="Ngày chuyển hộ"
          value={value.moveDate ?? ''}
          error={fieldErrors?.moveDate}
          onChange={(moveDate: string) => setValue({ ...value, moveDate })}
          required
        />
      )}
      {error && !fieldErrors && (
        <p role="alert" className={styles.error}>
          {messageFor(error)}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" variant="primary" isPending={isPending} disabled={isPending}>
          {mode === 'move' ? 'Chuyển hộ' : 'Lưu'}
        </Button>
      </div>
    </form>
  )
}
