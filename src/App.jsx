import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { supabase } from './lib/supabase'
import MobileLayout from './components/Layout/MobileLayout'
import SplashScreen from './components/SplashScreen'
import { ThemeProvider } from './contexts/ThemeContext'

// Lazy-loaded pages — each becomes its own chunk for faster initial load
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Login = lazy(() => import('./pages/Login'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const GroupDetail = lazy(() => import('./pages/GroupDetail'))
const PublicParticipant = lazy(() => import('./pages/PublicParticipant'))

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Orientation Lock logic
    const lockOrientation = async () => {
      try {
        if (window.screen?.orientation?.lock) {
          await window.screen.orientation.lock('portrait').catch(() => { });
        } else if (window.screen?.lockOrientation) {
          window.screen.lockOrientation('portrait');
        }
      } catch (err) { }
    }

    lockOrientation()

    // Check session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // Splash Screen Timer (min 2.5 seconds)
    const splashTimer = setTimeout(() => {
      setShowSplash(false)
    }, 2500)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lockOrientation()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      clearTimeout(splashTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  if (showSplash || loading) {
    return <SplashScreen />
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent session={session} />
      </BrowserRouter>
    </ThemeProvider>
  )
}

/** Lightweight spinner shown while lazy chunks load */
function PageLoader() {
  return (
    <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  )
}

function AppContent({ session }) {
  const location = useLocation()

  return (
    <AnimatePresence mode="popLayout">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/p/:slug" element={<PublicParticipant />} />
          <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />

          <Route element={session ? <MobileLayout /> : <Navigate to="/login" />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/groups" element={<div className="p-4">Halaman Kelompok</div>} />
            <Route path="/account" element={<div className="p-4">Halaman Akun</div>} />
            <Route path="/groups/:id" element={<GroupDetail />} />
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

export default App
