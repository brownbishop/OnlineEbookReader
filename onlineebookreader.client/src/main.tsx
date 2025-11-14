import {createRoot} from 'react-dom/client'
import {useEffect} from 'react'
import App from './App.tsx'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Reader from '@/components/Reader'
import Login from '@/components/Login'
import './styles/globals.css'
import Signup from '@/components/Signup.tsx'
import UploadBook from './components/UploadBook.tsx'
import { useAppState } from '@/lib/store'
import BookLibrary from './components/BookLibrary.tsx'

function RootComponent() {
    const initializeAuth = useAppState(state => state.initializeAuth)

    useEffect(() => {
        initializeAuth()
    }, [initializeAuth])

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/reader" element={<Reader />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/upload" element={<UploadBook />} />
                <Route path="/books" element={<BookLibrary />} />
            </Routes>
        </BrowserRouter>
    )
}

createRoot(document.getElementById('root')!).render(
    <RootComponent />
)
