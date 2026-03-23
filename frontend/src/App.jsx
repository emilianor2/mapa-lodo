import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import MapPage from './pages/MapPage';
import AdminPage from './pages/AdminPage';
import AdminStatsPage from './pages/AdminStatsPage';
import AdminProfilePage from './pages/AdminProfilePage';
import HomePage from './pages/HomePage';
import ContactPage from './pages/ContactPage';

function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/stats" element={<AdminStatsPage />} />
                <Route path="/admin/profile" element={<AdminProfilePage />} />
                <Route path="/contacto" element={<ContactPage />} />
            </Routes>
            <Toaster position="top-center" richColors />
        </>
    );
}

export default App;
