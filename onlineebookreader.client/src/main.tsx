import {createRoot} from 'react-dom/client'
import App from './App.tsx'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Reader from '@/components/Reader'
import Login from '@/components/Login'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/reader" element={<Reader />} />
            <Route path="/login" element={<Login />} />
        </Routes>
    </BrowserRouter>,
)
