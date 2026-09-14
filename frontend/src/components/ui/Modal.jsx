import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button.jsx'
import styles from './Modal.module.css'

export const Modal = forwardRef(function Modal(
  { title, children, onClose, isOpen = true, variant = 'modal', ...rest },
  ref,
) {
  const dialogRef = useRef(null)
  const titleId = useId()
  useImperativeHandle(ref, () => dialogRef.current)
  useEffect(() => {
    if (!isOpen) return undefined
    const dialog = dialogRef.current
    const trigger = document.activeElement
    // Dialog gốc giữ focus bên trong và làm phần nền không thể tương tác.
    dialog.showModal()
    return () => {
      dialog.close()
      if (trigger?.isConnected) trigger.focus()
    }
  }, [isOpen])
  if (!isOpen) return null
  return createPortal(
    <dialog
      {...rest}
      ref={dialogRef}
      aria-labelledby={titleId}
      className={styles.dialog}
      data-variant={variant}
      onCancel={(event) => {
        event.preventDefault()
        onClose?.()
      }}
    >
      <header className={styles.header}>
        <h2 id={titleId}>{title}</h2>
        <Button aria-label="Đóng hộp thoại" onClick={onClose} disabled={!onClose}>
          Đóng
        </Button>
      </header>
      <div className={styles.body}>{children}</div>
    </dialog>,
    document.getElementById('overlays') || document.body,
  )
})
