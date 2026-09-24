import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { DateInput } from '@/components/ui/DateInput.tsx'
import { SearchableSelect } from '@/components/ui/SearchableSelect.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { AppClientError } from '@/shared/invoke.ts'
import { calendarToday } from '@/shared/calendar.ts'
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
  personSearch?: string
  onPersonSearchChange?: (value: string) => void
  peopleLoading?: boolean
  families?: FamilyChoice[]
  initialValue?: Partial<FormValue>
  onSubmit: (value: AddValue | MoveValue) => Promise<unknown>
  isPending: boolean
  mode?: 'add' | 'move'
  showHeadWarning?: boolean
}

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
  personSearch = '',
  onPersonSearchChange,
  peopleLoading = false,
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
    fromDate: mode === 'add' ? calendarToday() : '',
    toFamilyId: '',
    moveDate: mode === 'move' ? calendarToday() : '',
    ...initialValue,
  })
  const [error, setError] = useState<AppClientError | null>(null)
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
        <>
          <SearchableSelect
            label="Giáo dân cần thêm vào hộ"
            value={value.personId}
            options={people}
            error={fieldErrors?.personId}
            placeholder="Tìm giáo dân theo tên..."
            emptyLabel={
              personSearch.trim() ? 'Không tìm thấy giáo dân phù hợp' : 'Nhập tên để tìm giáo dân'
            }
            loading={peopleLoading}
            getOptionLabel={(person: PersonChoice) =>
              `${person.fullName}${person.familyName ? ` (${person.familyName})` : ''}`
            }
            getOptionValue={(person: PersonChoice) => person.id}
            onSearchChange={(nextSearch: string) => {
              setValue({ ...value, personId: '' })
              onPersonSearchChange?.(nextSearch)
            }}
            onChange={(nextId: string) => setValue({ ...value, personId: nextId })}
            required
          />
        </>
      )}
      {mode === 'move' && (
        <>
          {showHeadWarning && (
            <p className={styles.warning}>
              Người này đang là chủ hộ. Sau khi chuyển, hộ cũ sẽ không còn chủ hộ.
            </p>
          )}
          <SearchableSelect
            label="Hộ đích"
            value={value.toFamilyId ?? ''}
            options={families}
            error={fieldErrors?.toFamilyId}
            placeholder="Tìm hộ đích..."
            getOptionLabel={(family: FamilyChoice) => family.name}
            getOptionValue={(family: FamilyChoice) => family.id}
            onChange={(nextId: string) => setValue({ ...value, toFamilyId: nextId })}
            required
          />
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
