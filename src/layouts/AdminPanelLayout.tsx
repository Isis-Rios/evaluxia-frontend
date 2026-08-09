import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AdminPanelLayout() {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflowX: 'hidden' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <Box component="main" sx={{ flexGrow: 1, p: 3, overflowY: 'auto', overflowX: 'hidden' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}