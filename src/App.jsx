import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { supabase } from './lib/supabase'
import MobileLayout from './components/Layout/MobileLayout'
import SplashScreen from './components/SplashScreen'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import GroupDetail from './pages/GroupDetail'
import { ThemeProvider } from './contexts/ThemeContext'

import PublicParticipant from './pages/PublicParticipant'

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

function AppContent({ session }) {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
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
    </AnimatePresence>
  )
}

export default App
