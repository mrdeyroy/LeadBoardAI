import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { AppShell } from '@/components/layout/AppShell'
import { GuestOnly, RequireAuth } from '@/components/RouteGuards'
import { ClerkTokenBridge } from '@/context/ClerkTokenBridge'

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Outreach = lazy(() => import('@/pages/Outreach'))
const Leads = lazy(() => import('@/pages/Leads'))
const LeadDetails = lazy(() => import('@/pages/LeadDetails'))
const FollowUps = lazy(() => import('@/pages/FollowUps'))
const Settings = lazy(() => import('@/pages/Settings'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
    </div>
  )
}

function withSuspense(node) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>
}

function App() {
  return (
    <>
      <ClerkTokenBridge />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={withSuspense(<LandingPage />)} />
          <Route path="/login">
            <Route index element={<GuestOnly>{withSuspense(<Login />)}</GuestOnly>} />
            <Route path="*" element={<GuestOnly>{withSuspense(<Login />)}</GuestOnly>} />
          </Route>
          <Route path="/register">
            <Route index element={<GuestOnly>{withSuspense(<Register />)}</GuestOnly>} />
            <Route path="*" element={<GuestOnly>{withSuspense(<Register />)}</GuestOnly>} />
          </Route>
          <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route path="/dashboard" element={withSuspense(<Dashboard />)} />
            <Route path="/outreach" element={withSuspense(<Outreach />)} />
            <Route path="/leads" element={withSuspense(<Leads />)} />
            <Route path="/leads/:id" element={withSuspense(<LeadDetails />)} />
            <Route path="/follow-ups" element={withSuspense(<FollowUps />)} />
            <Route path="/settings" element={withSuspense(<Settings />)} />
          </Route>
          <Route path="*" element={withSuspense(<NotFound />)} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App