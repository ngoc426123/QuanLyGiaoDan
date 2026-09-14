import { forwardRef } from 'react'
import { Modal } from './Modal.tsx'
import { Button } from './Button.tsx'

export const ConfirmDialog = forwardRef<any, any>(function ConfirmDialog(
  { title = 'Xác nhận xoá', children, onConfirm, onClose, isPending = false, ...rest },
  ref,
) {
  return (
    <Modal {...rest} ref={ref} title={title} onClose={isPending ? undefined : onClose}>
      <p>{children}</p>
      <Button
        variant="danger"
        disabled={isPending}
        isPending={isPending}
        onClick={() => {
          if (!isPending) onConfirm()
        }}
      >
        Xác nhận xoá
      </Button>
      <Button onClick={onClose} disabled={isPending}>
        Huỷ
      </Button>
    </Modal>
  )
})
