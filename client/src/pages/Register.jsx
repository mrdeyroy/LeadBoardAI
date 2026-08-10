import { SignUp } from '@clerk/clerk-react'

import { AuthLayoutCard } from '@/components/auth/auth-ui'

const CLERK_APPEARANCE = {
  elements: {
    rootBox: 'w-full',
    card: 'w-full shadow-none border-0 p-0 bg-transparent',
    header: 'hidden',
    formButtonPrimary: 'rounded-md',
    dividerRow: 'my-4',
    footerActionText: 'text-sm text-muted-foreground',
    footerActionLink: 'text-sm font-medium text-foreground underline-offset-4',
    formFieldLabel: 'text-xs font-medium text-muted-foreground',
    formFieldInput:
      'rounded-md border bg-background px-3 py-2 text-sm shadow-none placeholder:text-muted-foreground',
    socialButtonsBlockButton:
      'rounded-md border bg-background text-sm hover:bg-accent hover:text-accent-foreground',
    dividerLine: 'bg-border',
  },
}

export default function Register() {
  return (
    <AuthLayoutCard title="Create your account" description="Set up LeadBoard for your business.">
      <SignUp
        routing="path"
        path="/register"
        signInUrl="/login"
        fallbackRedirectUrl="/dashboard"
        appearance={CLERK_APPEARANCE}
      />
    </AuthLayoutCard>
  )
}