import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { AppearanceSettings } from '@/features/setting/components/AppearanceSettings.jsx'
import { BackupSettings } from '@/features/backup/components/BackupSettings.jsx'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  return (
    <div className={styles.page}>
      <PageHeader title="Cài đặt" description="Tuỳ chỉnh giao diện và quản lý dữ liệu của bạn." />
      <AppearanceSettings />
      <BackupSettings />
      <section className={styles.info}>
        <h2>Phím tắt</h2>
        <p>
          Ctrl + F: Tìm kiếm · Ctrl + B: Thu gọn thanh bên · Ctrl + ,: Cài đặt · Esc: Đóng hộp thoại
        </p>
      </section>
      <section className={styles.info}>
        <h2>Giới thiệu</h2>
        <p>
          Elecrusion — Quản lý giáo dân giáo xứ. Dữ liệu lưu cục bộ trên máy, sử dụng hoàn toàn
          ngoại tuyến.
        </p>
      </section>
    </div>
  )
}
