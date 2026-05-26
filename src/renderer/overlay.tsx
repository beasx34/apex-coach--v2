import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Overlay } from './overlay/Overlay'

const container = document.getElementById('root')
if (!container) throw new Error('root container missing')
createRoot(container).render(
  <StrictMode>
    <Overlay />
  </StrictMode>
)
