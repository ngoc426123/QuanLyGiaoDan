import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { AppearanceSettings } from '@/features/setting/components/AppearanceSettings.tsx'
import { DataSettings } from '@/features/setting/components/DataSettings.tsx'
import { BackupSettings } from '@/features/backup/components/BackupSettings.tsx'
import { useAppVersion } from '@/features/app/hooks/useAppInfo.ts'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const version = useAppVersion()
  return (
    <div className={styles.page}>
      <PageHeader title="Cài đặt" description="Tuỳ chỉnh giao diện và quản lý dữ liệu của bạn." />
      <AppearanceSettings />
      <DataSettings />
      <BackupSettings />
      <section className={styles.info}>
        <h2>Phím tắt</h2>
        <dl className={styles.shortcuts}>
          <dt>Ctrl/Cmd + K</dt>
          <dd>Mở bảng lệnh</dd>
          <dt>Ctrl/Cmd + N</dt>
          <dd>Thêm giáo dân</dd>
          <dt>Ctrl/Cmd + F</dt>
          <dd>Đến ô tìm kiếm</dd>
          <dt>Ctrl/Cmd + B</dt>
          <dd>Ẩn hoặc hiện thanh bên</dd>
          <dt>Ctrl/Cmd + ,</dt>
          <dd>Mở cài đặt</dd>
          <dt>Esc</dt>
          <dd>Đóng lớp phủ đang mở</dd>
          <dt>Mũi tên, Enter, Delete</dt>
          <dd>Di chuyển, mở và xóa trong danh sách</dd>
        </dl>
      </section>
      <section className={styles.info}>
        <h2>Giới thiệu</h2>
        <p>
          Elecrusion — Quản lý giáo dân giáo xứ. Dữ liệu lưu cục bộ trên máy, sử dụng hoàn toàn
          ngoại tuyến.
        </p>
        {version.data && (
          <p>
            Ứng dụng {version.data.app} · Electron {version.data.electron} · Node{' '}
            {version.data.node} · Chrome {version.data.chrome}
          </p>
        )}
      </section>
    </div>
  )
}
