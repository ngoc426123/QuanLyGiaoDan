import { useState } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { relationshipOptions } from '@/features/family-member/familyMember.types.ts'
import { useBulkMovePersons, useBulkRemovePersons } from '../hooks/usePersonMutations.ts'

const today = () => new Date().toISOString().slice(0, 10)

export function PersonBulkActions({ ids, families, onDone }: any) {
  const [isMoveOpen, setMoveOpen] = useState(false)
  const [isRemoveOpen, setRemoveOpen] = useState(false)
  const [familyId, setFamilyId] = useState('')
  const [relationship, setRelationship] = useState('other')
  const [moveDate, setMoveDate] = useState(today)
  const move = useBulkMovePersons()
  const remove = useBulkRemovePersons()
  if (ids.length === 0) return null
  return (
    <section aria-label="Thao tác hàng loạt">
      <p>Đã chọn {ids.length} giáo dân</p>
      <Button variant="secondary" onClick={() => setMoveOpen(true)}>
        Chuyển vào hộ
      </Button>
      <Button variant="danger" onClick={() => setRemoveOpen(true)}>
        Xóa đã chọn
      </Button>
      <Button variant="secondary" onClick={onDone}>
        Bỏ chọn
      </Button>
      {isMoveOpen && (
        <Modal title="Chuyển nhiều giáo dân sang hộ" onClose={() => setMoveOpen(false)}>
          <Select
            label="Hộ đích"
            value={familyId}
            onChange={(event: any) => setFamilyId(event.target.value)}
          >
            <option value="">Chọn hộ</option>
            {families.map((family: any) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </Select>
          <Select
            label="Quan hệ"
            value={relationship}
            onChange={(event: any) => setRelationship(event.target.value)}
          >
            {relationshipOptions
              .filter(([value]) => value !== 'head')
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </Select>
          <Input
            label="Ngày chuyển hộ"
            type="date"
            value={moveDate}
            onChange={(event: any) => setMoveDate(event.target.value)}
          />
          <Button
            isPending={move.isPending}
            disabled={!familyId || !moveDate}
            onClick={() =>
              move.mutate(
                { ids, familyId, relationship, moveDate },
                {
                  onSuccess: () => {
                    setMoveOpen(false)
                    onDone()
                  },
                },
              )
            }
          >
            Chuyển {ids.length} người
          </Button>
        </Modal>
      )}
      {isRemoveOpen && (
        <ConfirmDialog
          title="Xóa nhiều giáo dân"
          isPending={remove.isPending}
          onClose={() => setRemoveOpen(false)}
          onConfirm={() =>
            remove.mutate(ids, {
              onSuccess: () => {
                setRemoveOpen(false)
                onDone()
              },
            })
          }
        >
          Bạn có chắc muốn chuyển {ids.length} giáo dân vào thùng rác?
        </ConfirmDialog>
      )}
    </section>
  )
}
