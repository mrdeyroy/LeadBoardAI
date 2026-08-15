import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { ArrowRight, Menu, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function Navbar() {
  const { isSignedIn } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMenu = () => setMobileOpen(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 group" onClick={closeMenu}>
          <div className="flex size-8 items-center justify-center rounded-full bg-foreground text-background font-bold transition-transform group-hover:scale-105">
            <Sparkles className="size-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm tracking-tight text-foreground">LeadBoard AI</span>
            <span className="text-[10px] text-muted-foreground font-medium">Agency CRM</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          <a href="#metrics" className="transition-colors hover:text-foreground">Metrics</a>
          <a href="#problem" className="transition-colors hover:text-foreground">Why LeadBoard</a>
          <a href="#workflow" className="transition-colors hover:text-foreground">Workflow</a>
          <a href="#ai-assistant" className="transition-colors hover:text-foreground">AI Assistant</a>
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#reviews" className="transition-colors hover:text-foreground">Pilot Feedback</a>
          <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
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

          {/* Mobile Hamburger Toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden size-9 rounded-full border border-border/80"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-border/80 bg-background/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3 text-sm font-medium text-muted-foreground pt-1">
            <a href="#metrics" onClick={closeMenu} className="px-2 py-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors">
              Metrics
            </a>
            <a href="#problem" onClick={closeMenu} className="px-2 py-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors">
              Why LeadBoard
            </a>
            <a href="#workflow" onClick={closeMenu} className="px-2 py-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors">
              Workflow
            </a>
            <a href="#ai-assistant" onClick={closeMenu} className="px-2 py-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors">
              AI Assistant
            </a>
            <a href="#features" onClick={closeMenu} className="px-2 py-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#reviews" onClick={closeMenu} className="px-2 py-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors">
              Pilot Feedback
            </a>
            <a href="#pricing" onClick={closeMenu} className="px-2 py-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors">
              Pricing
            </a>
          </nav>

          <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
            {isSignedIn ? (
              <Link to="/dashboard" onClick={closeMenu} className="w-full">
                <Button size="sm" className="w-full rounded-full text-xs font-semibold py-2.5">
                  Go to Dashboard <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={closeMenu}>
                  <Button variant="outline" size="sm" className="w-full rounded-full text-xs font-medium">
                    Log in
                  </Button>
                </Link>
                <Link to="/register" onClick={closeMenu}>
                  <Button size="sm" className="w-full rounded-full text-xs font-semibold">
                    Start Free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
