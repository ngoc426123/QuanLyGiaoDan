import { createPortal } from 'react-dom'
import { useOverlayStore } from '@/stores/overlay.store.ts'
import { useToastStore } from '@/stores/toast.store.ts'
import { Modal } from '@/components/ui/Modal.tsx'
import { Drawer } from '@/components/ui/Drawer.tsx'
import { Toast } from '@/components/ui/Toast.tsx'
import styles from './OverlayRoot.module.css'

export function OverlayRoot() {
  const stack = useOverlayStore((state) => state.stack)
  const close = useOverlayStore((state) => state.close)
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)
  return (
    <>
      {stack.map((overlay) =>
        overlay.type === 'drawer' ? (
          <Drawer key={overlay.id} title={overlay.title} onClose={close}>
            {overlay.message}
          </Drawer>
        ) : (
          <Modal key={overlay.id} title={overlay.title} onClose={close}>
            {overlay.message}
          </Modal>
        ),
      )}
      {createPortal(
        <div className={styles.toasts} aria-label="Thông báo">
          {toasts.map((toast) => (
            <Toast key={toast.id} isError={toast.isError} onDismiss={() => dismiss(toast.id)}>
              {toast.message}
            </Toast>
          ))}
        </div>,
        document.getElementById('overlays') || document.body,
      )}
    </>
  )
}
