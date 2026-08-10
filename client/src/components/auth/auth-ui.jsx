import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api'

export function AuthLayoutCard({ title, description, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  )
}

export function PasswordInput({ ...props }) {
  return <Input type="password" {...props} />
}

export function FormError({ message }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  )
}

export function useFormSubmit(run) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await run()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, submit }
}

export function SubmitButton({ loading, children }) {
  return (
    <Button type="submit" className="w-full" disabled={loading}>
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  )
}

export function AuthFooter({ prompt, to, action }) {
  return (
    <p className="mt-4 text-center text-sm text-muted-foreground">
      {prompt}{' '}
      <Link to={to} className="font-medium text-foreground underline-offset-4 hover:underline">
        {action}
      </Link>
    </p>
  )
}