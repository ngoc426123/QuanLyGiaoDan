import { forwardRef } from 'react'
import { EmptyState } from './EmptyState.tsx'

export const ErrorState = forwardRef<any, any>(function ErrorState(
  { error, onRetry, ...rest },
  ref,
) {
  return (
    <EmptyState
      {...rest}
      ref={ref}
      role="alert"
      title="Không tải được nội dung"
      actionLabel="Thử lại"
      onAction={onRetry}
    >
      {error?.message || 'Đã xảy ra lỗi khi hiển thị. Vui lòng thử lại.'}
      {import.meta.env.DEV && error?.code && <span> ({error.code})</span>}
    </EmptyState>
  )
})
