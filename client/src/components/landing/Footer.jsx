import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-background text-foreground border-t border-border/60 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 pb-12 border-b border-border/60">
          {/* Brand */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-full bg-foreground text-background font-bold">
                <Sparkles className="size-3.5" />
              </div>
              <span className="font-bold text-sm tracking-tight text-foreground">LeadBoard AI</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Lightweight AI-assisted CRM for solo founders, agencies, and small sales teams.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-2.5 text-xs">
            <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">Product</p>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#workflow" className="hover:text-foreground transition-colors">7-Stage Workflow</a></li>
              <li><a href="#ai-assistant" className="hover:text-foreground transition-colors">AI Sales Assistant</a></li>
              <li><a href="#reviews" className="hover:text-foreground transition-colors">Verified Reviews</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing Plans</a></li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-2.5 text-xs">
            <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">Account</p>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground transition-colors">Log In</Link></li>
              <li><Link to="/register" className="hover:text-foreground transition-colors">Create Free Account</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground transition-colors">App Dashboard</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-2.5 text-xs">
            <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">Developer & Open Source</p>
            <a
              href="https://github.com/mrdeyroy/LeadBoardAI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <svg className="size-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} LeadBoard AI. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
