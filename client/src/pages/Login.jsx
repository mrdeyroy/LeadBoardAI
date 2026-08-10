import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import {
  AuthFooter,
  AuthLayoutCard,
  FormError,
  SubmitButton,
  useFormSubmit,
} from '@/components/auth/auth-ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()
  const { loading, error, submit } = useFormSubmit(async () => {
    await login(email, password)
    navigate('/dashboard')
  })

  return (
    <AuthLayoutCard title="Welcome back" description="Sign in to your LeadBoard workspace.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <FormError message={error} />
        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>
      <AuthFooter prompt="Don't have an account?" to="/register" action="Create one" />
    </AuthLayoutCard>
  )
}