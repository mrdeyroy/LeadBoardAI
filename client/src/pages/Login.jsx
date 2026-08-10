import { SignIn } from '@clerk/clerk-react'

import { AuthLayoutCard } from '@/components/auth/auth-ui'

const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: '#171717',
    fontFamily: 'inherit',
    fontSize: '0.875rem',
  },
  elements: {
    rootBox: 'w-full! max-w-full! min-w-0!',
    cardBox: 'w-full! max-w-full! min-w-0!',
    card: 'w-full! max-w-full! min-w-0! shadow-none border-0 p-0 bg-transparent',
    main: 'w-full! max-w-full! min-w-0!',
    header: 'hidden',
    form: 'gap-4',
    formButtonPrimary: 'rounded-md font-medium',
    dividerRow: 'my-4',
    dividerText: 'text-xs text-muted-foreground',
    footerActionText: 'text-sm text-muted-foreground',
    footerActionLink: 'text-sm font-medium text-foreground underline-offset-4',
    formFieldLabel: 'text-xs font-medium text-muted-foreground',
    formFieldInput:
      'rounded-md border bg-background px-3 py-2 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring',
    socialButtonsBlockButton:
      'rounded-md border bg-background text-sm hover:bg-accent hover:text-accent-foreground',
    dividerLine: 'bg-border',
  },
}

export default function Login() {
  return (
    <AuthLayoutCard title="Welcome back" description="Sign in to your LeadBoard workspace.">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/register"
        fallbackRedirectUrl="/dashboard"
        appearance={CLERK_APPEARANCE}
      />
    </AuthLayoutCard>
  )
}