import { useState } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { useBulkMoveFamilies, useBulkRemoveFamilies } from '../hooks/useFamilyMutations.ts'

export function FamilyBulkActions({ ids, zones, onDone }: any) {
  const [isMoveOpen, setMoveOpen] = useState(false)
  const [isRemoveOpen, setRemoveOpen] = useState(false)
  const [zoneId, setZoneId] = useState('')
  const move = useBulkMoveFamilies()
  const remove = useBulkRemoveFamilies()
  if (ids.length === 0) return null
  return (
    <section aria-label="Thao tác hàng loạt">
      <p>Đã chọn {ids.length} hộ gia đình</p>
      <Button variant="secondary" onClick={() => setMoveOpen(true)}>
        Chuyển giáo họ
      </Button>
      <Button variant="danger" onClick={() => setRemoveOpen(true)}>
        Xóa đã chọn
      </Button>
      <Button variant="secondary" onClick={onDone}>
        Bỏ chọn
      </Button>
      {isMoveOpen && (
        <Modal title="Chuyển nhiều hộ sang giáo họ" onClose={() => setMoveOpen(false)}>
          <Select
            label="Giáo họ đích"
            value={zoneId}
            onChange={(event: any) => setZoneId(event.target.value)}
          >
            <option value="">Chọn giáo họ</option>
            {zones.map((zone: any) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </Select>
          <Button
            isPending={move.isPending}
            disabled={!zoneId}
            onClick={() =>
              move.mutate(
                { ids, zoneId },
                {
                  onSuccess: () => {
                    setMoveOpen(false)
                    onDone()
                  },
                },
              )
            }
          >
            Chuyển {ids.length} hộ
          </Button>
        </Modal>
      )}
      {isRemoveOpen && (
        <ConfirmDialog
          title="Xóa nhiều hộ"
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
          Hộ còn thành viên sẽ không thể xóa. Bạn có chắc muốn tiếp tục?
        </ConfirmDialog>
      )}
    </section>
  )
}
