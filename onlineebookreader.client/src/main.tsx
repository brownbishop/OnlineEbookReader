import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'
import App from './App.tsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Reader from '@/components/Reader'
import Login from '@/components/Login'
import './styles/globals.css'
import Signup from '@/components/Signup.tsx'
import UploadBook from './components/UploadBook.tsx'
import { useAppState } from '@/lib/store'
import BookLibrary from './components/BookLibrary.tsx'
import LandingPage from './components/LandingPage.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import FoliateReader from './components/FoliateReader.tsx'


function RootComponent() {
    const initializeAuth = useAppState(state => state.initializeAuth)
    const initializeTheme = useAppState(state => state.initializeTheme)

    useEffect(() => {
        initializeAuth()
        initializeTheme()
    }, [initializeAuth, initializeTheme])

    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/home" element={<App />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/upload" element={<UploadBook />} />
                    <Route path="/library" element={<BookLibrary />} />
                    <Route path="/reader" element={<FoliateReader />} />
                </Routes>

            </BrowserRouter>
        </ErrorBoundary>
    )
}

const rootElement = document.getElementById('root')
if (!rootElement) {
    throw new Error('Root element not found')
}

createRoot(rootElement).render(
    <RootComponent />
)
