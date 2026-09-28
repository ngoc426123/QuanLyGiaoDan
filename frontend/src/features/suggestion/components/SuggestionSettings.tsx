import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Icon } from '@/components/ui/Icon.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { useSuggestionMutations, useSuggestions } from '../hooks/useSuggestions.ts'
import styles from './SuggestionSettings.module.css'

const categories = [
  ['holy_name', 'Tên thánh'],
  ['birth_place', 'Nơi sinh'],
  ['parish', 'Giáo xứ'],
  ['priest', 'Linh mục'],
  ['diocese', 'Giáo phận'],
] as const

export function SuggestionSettings() {
  const [category, setCategory] = useState<(typeof categories)[number][0]>('holy_name')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [removing, setRemoving] = useState<any>(null)
  const query = useSuggestions(category, search)
  const mutations = useSuggestionMutations()
  const label = categories.find(([id]) => id === category)?.[1] ?? 'Danh mục'
  const rows = query.data?.data ?? []
  const pending =
    mutations.create.isPending || mutations.update.isPending || mutations.remove.isPending
  const error =
    query.error || mutations.create.error || mutations.update.error || mutations.remove.error
  const actionError = error && !query.error ? error : null

  const resetEditor = () => {
    setDraft('')
    setEditing(null)
  }
  const save = async (event: any) => {
    event.preventDefault()
    if (!draft.trim()) return
    await mutations.create.mutateAsync({ category, value: draft })
    setDraft('')
  }
  const beginEdit = (row: any) => {
    setEditing(row)
    setDraft(row.value)
  }
  const saveEdit = async (event: any) => {
    event.preventDefault()
    if (!editing || !draft.trim()) return
    await mutations.update.mutateAsync({
      id: editing.id,
      expectedUpdatedAt: editing.updatedAt,
      patch: { value: draft },
    })
    resetEditor()
  }
  const tabs = useMemo(() => categories, [])

  return (
    <section className={styles.panel} aria-labelledby="suggestion-settings-title">
      <div>
        <h2 id="suggestion-settings-title">Danh mục gợi ý</h2>
        <p className={styles.description}>
          Quản lý các giá trị được đề xuất khi nhập hồ sơ. Giá trị này không bắt buộc và không thay
          đổi dữ liệu đã lưu.
        </p>
      </div>
      <div className={styles.tabs} role="tablist" aria-label="Danh mục gợi ý">
        {tabs.map(([id, title]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={category === id}
            className={styles.tab}
            data-selected={category === id}
            onClick={() => {
              setCategory(id)
              resetEditor()
              setSearch('')
            }}
          >
            {title}
          </button>
        ))}
      </div>
      <div className={styles.tools}>
        <div className={styles.search}>
          <Input
            label={`Tìm trong ${label.toLowerCase()}`}
            value={search}
            onChange={(event: any) => setSearch(event.target.value)}
          />
        </div>
        <form className={styles.form} onSubmit={save}>
          <Input
            label={`Thêm ${label.toLowerCase()}`}
            value={draft}
            maxLength={120}
            disabled={pending}
            onChange={(event: any) => setDraft(event.target.value)}
          />
          <div className={styles.actions}>
            <Button
              variant="primary"
              type="submit"
              disabled={pending || !draft.trim()}
              isPending={pending}
            >
              Thêm giá trị
            </Button>
          </div>
        </form>
      </div>
      {query.isLoading && <Skeleton />}
      {query.isError && <ErrorState error={query.error} onRetry={query.refetch} />}
      {actionError && <ErrorState error={actionError} onRetry={() => undefined} />}
      {!query.isLoading && !query.isError && rows.length === 0 && (
        <EmptyState title="Chưa có giá trị gợi ý">
          Thêm giá trị đầu tiên cho danh mục này.
        </EmptyState>
      )}
      {rows.length > 0 && (
        <div className={styles.list} role="list" aria-label={`Danh sách ${label.toLowerCase()}`}>
          {rows.map((row: any) => (
            <div className={styles.tag} role="listitem" key={row.id} tabIndex={0}>
              <span>{row.value}</span>
              <div className={styles.rowActions}>
                <Button
                  type="button"
                  aria-label={`Sửa ${row.value}`}
                  title="Sửa"
                  onClick={() => beginEdit(row)}
                  disabled={pending}
                >
                  <Icon name="edit" />
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  aria-label={`Xóa ${row.value}`}
                  title="Xóa"
                  onClick={() => setRemoving(row)}
                  disabled={pending}
                >
                  <Icon name="trash" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <Modal title={`Sửa ${label.toLowerCase()}`} onClose={resetEditor}>
          <form className={styles.editForm} onSubmit={saveEdit}>
            <Input
              label={label}
              value={draft}
              maxLength={120}
              disabled={mutations.update.isPending}
              autoFocus
              onChange={(event: any) => setDraft(event.target.value)}
            />
            <div className={styles.editActions}>
              <Button
                variant="primary"
                type="submit"
                disabled={mutations.update.isPending || !draft.trim()}
                isPending={mutations.update.isPending}
              >
                Lưu thay đổi
              </Button>
              <Button type="button" onClick={resetEditor} disabled={mutations.update.isPending}>
                Hủy
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {removing && (
        <ConfirmDialog
          title="Xóa giá trị gợi ý"
          confirmLabel="Xóa"
          confirmVariant="danger"
          isPending={mutations.remove.isPending}
          onClose={() => setRemoving(null)}
          onConfirm={() =>
            mutations.remove.mutate(removing.id, { onSuccess: () => setRemoving(null) })
          }
        >
          Giá trị “{removing.value}” sẽ không còn được đề xuất trong các ô nhập.
        </ConfirmDialog>
      )}
    </section>
  )
}
