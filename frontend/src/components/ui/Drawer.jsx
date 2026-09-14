import { forwardRef } from 'react'
import { Modal } from './Modal.jsx'

export const Drawer = forwardRef(function Drawer(props, ref) {
  return <Modal {...props} ref={ref} variant="drawer" />
})
