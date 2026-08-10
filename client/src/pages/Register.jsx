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

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { register } = useAuth()
  const { loading, error, submit } = useFormSubmit(async () => {
    await register(name, email, password)
    navigate('/dashboard')
  })

  return (
    <AuthLayoutCard title="Create your account" description="Set up LeadBoard for your business.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Jane Cooper"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
            placeholder="At least 6 characters"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <FormError message={error} />
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
      <AuthFooter prompt="Already have an account?" to="/login" action="Sign in" />
    </AuthLayoutCard>
  )
}