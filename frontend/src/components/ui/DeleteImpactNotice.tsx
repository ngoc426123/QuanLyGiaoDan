import styles from './DeleteImpactNotice.module.css'

type EntityType = 'person' | 'family' | 'marriage' | 'familyMember' | 'zone'

export function DeleteImpactNotice({ entity, name, count, affectedCount, affectedFamilyCount }: { entity: EntityType; name?: string; count?: number; affectedCount?: number; affectedFamilyCount?: number }) {
  const pluralLabel = {
    person: 'giáo dân',
    family: 'hộ gia đình',
    marriage: 'hôn phối',
    familyMember: 'liên kết thành viên',
    zone: 'giáo họ',
  }[entity]
  const subject = count ? `${count} ${pluralLabel}` : name

  if (entity === 'person')
    return (
      <div className={styles.notice}>
        <p>{subject} sẽ được chuyển vào Thùng rác.</p>
        <p>Các dữ liệu liên quan cũng sẽ bị xoá mềm:</p>
        <ul>
          <li>Các bản ghi hôn phối có người này tham gia và liên kết người tham dự.</li>
          <li>Các liên kết cha/mẹ liên quan đến hồ sơ này.</li>
          <li>Thông tin bí tích và liên kết hộ hiện hành.</li>
        </ul>
        <p>Các hồ sơ giáo dân và hộ gia đình khác không bị xoá.</p>
      </div>
    )

  if (entity === 'family')
    return (
      <div className={styles.notice}>
        <p>{subject} sẽ được chuyển vào Thùng rác.</p>
        <p className={styles.strongWarning}>Cảnh báo: {affectedCount ?? 0} người sẽ không còn liên kết với hộ này.</p>
        <p>Hồ sơ giáo dân không bị xoá; chỉ liên kết thành viên hiện hành được xoá mềm và có thể khôi phục.</p>
      </div>
    )

  if (entity === 'marriage')
    return (
      <div className={styles.notice}>
        <p>{subject} sẽ được chuyển vào Thùng rác.</p>
        <p>Liên kết người tham dự hôn phối cũng bị xoá mềm. Hồ sơ của các giáo dân không bị ảnh hưởng.</p>
      </div>
    )

  if (entity === 'familyMember')
    return (
      <div className={styles.notice}>
        <p>Liên kết thành viên này sẽ được gỡ khỏi hộ và chuyển vào Thùng rác.</p>
        <p>Hồ sơ giáo dân và các dữ liệu khác của người đó không bị ảnh hưởng.</p>
      </div>
    )

  return (
    <div className={styles.notice}>
      <p>{subject} sẽ được chuyển vào Thùng rác.</p>
      <p className={styles.strongWarning}>Cảnh báo: {affectedFamilyCount ?? 0} hộ và {affectedCount ?? 0} giáo dân thuộc giáo họ sẽ bị ảnh hưởng.</p>
      <p>Các hộ và liên kết thành viên hiện hành của họ cũng được xoá mềm. Hồ sơ giáo dân không bị xoá.</p>
    </div>
  )
}
