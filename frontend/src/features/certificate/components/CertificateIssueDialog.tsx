import { useState } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import { invoke } from '@/shared/invoke.ts'
import { useToastStore } from '@/stores/toast.store.ts'
import styles from './CertificateIssueDialog.module.css'

const labels = Object.freeze({
  baptism: 'Rửa tội',
  confirmation: 'Thêm sức',
  marriage: 'Hôn phối',
})

export function CertificateIssueDialog({ personId, type, onClose }: any) {
  const addToast = useToastStore((state) => state.add)
  const [registerBook, setRegisterBook] = useState('')
  const [registerPage, setRegisterPage] = useState('')
  const [registerEntry, setRegisterEntry] = useState('')
  const [isPending, setPending] = useState(false)
  const submit = async (event: any) => {
    event.preventDefault()
    setPending(true)
    try {
      const result: any = await invoke(
        window.api.certificate.issue({ personId, type, registerBook, registerPage, registerEntry }),
      )
      if (!result.canceled) addToast('Đã tạo chứng thư và ghi nhật ký phát hành.')
      onClose()
    } catch (error: any) {
      addToast(error.message, true)
    } finally {
      setPending(false)
    }
  }
  return (
    <Modal title={`Cấp chứng thư ${labels[type]}`} onClose={onClose}>
      <form className={styles.form} onSubmit={submit}>
        <Input
          label="Số quyển"
          value={registerBook}
          onChange={(event: any) => setRegisterBook(event.target.value)}
        />
        <Input
          label="Số tờ"
          value={registerPage}
          onChange={(event: any) => setRegisterPage(event.target.value)}
        />
        <Input
          label="Số thứ tự sổ"
          value={registerEntry}
          onChange={(event: any) => setRegisterEntry(event.target.value)}
        />
        <div className={styles.actions}>
          <Button type="submit" variant="primary" isPending={isPending}>
            Tạo PDF
          </Button>
        </div>
      </form>
    </Modal>
  )
}
