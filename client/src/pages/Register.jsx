import { SignUp } from '@clerk/clerk-react'

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

export default function Register() {
  return (
    <AuthLayoutCard
      title="Create your account"
      description="Secure your account with a password of 8 characters or more."
    >
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