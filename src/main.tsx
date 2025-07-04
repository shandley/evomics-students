import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import StatisticsApp from './StatisticsApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StatisticsApp />
  </StrictMode>,
)
