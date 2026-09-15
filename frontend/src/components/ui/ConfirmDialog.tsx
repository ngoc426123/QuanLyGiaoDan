import { forwardRef } from 'react'
import { Modal } from './Modal.tsx'
import { Button } from './Button.tsx'
import styles from './ConfirmDialog.module.css'

export const ConfirmDialog = forwardRef<any, any>(function ConfirmDialog(
  {
    title = 'Xác nhận xoá',
    children,
    onConfirm,
    onClose,
    isPending = false,
    confirmDisabled = false,
    ...rest
  },
  ref,
) {
  return (
    <Modal {...rest} ref={ref} title={title} onClose={isPending ? undefined : onClose}>
      <div className={styles.message}>{children}</div>
      <div className={styles.actions}>
        <Button onClick={onClose} disabled={isPending}>
          Huỷ
        </Button>
        <Button
          variant="danger"
          disabled={isPending || confirmDisabled}
          isPending={isPending}
          onClick={() => {
            if (!isPending) onConfirm()
          }}
        >
          Xác nhận xoá
        </Button>
      </div>
    </Modal>
  )
})
