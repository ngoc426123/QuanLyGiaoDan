import { forwardRef } from 'react'
import { Modal } from './Modal.tsx'

export const Drawer = forwardRef<any, any>(function Drawer(props, ref) {
  return <Modal {...props} ref={ref} variant="drawer" />
})
