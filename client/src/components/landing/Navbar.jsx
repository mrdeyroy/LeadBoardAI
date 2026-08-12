import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { ArrowRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function Navbar() {
  const { isSignedIn } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex size-8 items-center justify-center rounded-full bg-foreground text-background font-bold transition-transform group-hover:scale-105">
            <Sparkles className="size-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm tracking-tight text-foreground">LeadBoard AI</span>
            <span className="text-[10px] text-muted-foreground font-medium">Agency CRM</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          <a href="#problem" className="transition-colors hover:text-foreground">Why LeadBoard</a>
          <a href="#workflow" className="transition-colors hover:text-foreground">Workflow</a>
          <a href="#ai-assistant" className="transition-colors hover:text-foreground">AI Assistant</a>
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <Link to="/dashboard">
              <Button size="sm" className="rounded-full text-xs font-semibold px-4 shadow-sm">
                Go to Dashboard <ArrowRight className="ml-1.5 size-3.5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="rounded-full text-xs font-medium px-3 text-muted-foreground hover:text-foreground">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="rounded-full text-xs font-semibold px-4 shadow-sm">
                  Start Free <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
