import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import '@/lib/theme'
import { TooltipProvider } from '@/components/ui/tooltip'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </ClerkProvider>
  </StrictMode>,
)