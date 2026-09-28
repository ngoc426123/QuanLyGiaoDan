import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { SuggestionSettings } from '@/features/suggestion/components/SuggestionSettings.tsx'
import styles from './SuggestionSettingsPage.module.css'

export function SuggestionSettingsPage() {
  return (
    <div className={styles.page}>
      <PageHeader
        title="Danh mục gợi ý"
        description="Quản lý các giá trị được đề xuất khi nhập hồ sơ."
      >
        <Link to="/settings">
          <Button>Về Cài đặt</Button>
        </Link>
      </PageHeader>
      <SuggestionSettings />
    </div>
  )
}
