import { forwardRef, useEffect, useState } from 'react'
import styles from './Skeleton.module.css'

export const Skeleton = forwardRef(function Skeleton({ delayMs = 150, ...rest }, ref) {
  const [isVisible, setVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delayMs)
    return () => clearTimeout(timer)
  }, [delayMs])
  return (
    <div
      {...rest}
      ref={ref}
      role="status"
      aria-label="Đang tải nội dung"
      aria-busy="true"
      className={styles.skeleton}
      data-visible={isVisible}
    >
      <span />
    </div>
  )
})
