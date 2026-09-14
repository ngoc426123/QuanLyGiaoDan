import { useState } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.tsx'
import { useBulkRemoveZones } from '../hooks/useZoneMutations.ts'

export function ZoneBulkActions({ ids, onDone }: any) {
  const [isRemoveOpen, setRemoveOpen] = useState(false)
  const remove = useBulkRemoveZones()
  if (ids.length === 0) return null
  return (
    <section aria-label="Thao tác hàng loạt">
      <p>Đã chọn {ids.length} giáo họ</p>
      <Button variant="danger" onClick={() => setRemoveOpen(true)}>
        Xóa đã chọn
      </Button>
      <Button variant="secondary" onClick={onDone}>
        Bỏ chọn
      </Button>
      {isRemoveOpen && (
        <ConfirmDialog
          title="Xóa nhiều giáo họ"
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
          Giáo họ còn hộ gia đình sẽ không thể xóa. Bạn có chắc muốn tiếp tục?
        </ConfirmDialog>
      )}
    </section>
  )
}
