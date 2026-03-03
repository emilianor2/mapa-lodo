import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Map, Home, Settings, X, Menu, BarChart3 } from 'lucide-react';
import { Button } from '../ui/button';
import AppHeader from './AppHeader';

export default function AppShell({ children, onSearchChange, searchValue, resultsCount }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const colors = {
        green: "#6FEA44",
        dark: "#59595B"
    };

    const isMapPage = location.pathname.startsWith('/map');

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden" style={{ backgroundColor: colors.dark }}>

            <AppHeader
                onSearchChange={onSearchChange}
                searchValue={searchValue}
                resultsCount={resultsCount}
            />

            <main className="flex-1 relative overflow-hidden flex flex-col">
                <div
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${colors.green}, transparent 70%)` }}
                />

                <div className={`relative z-10 flex-1 ${isMapPage ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                    {children}
                </div>
            </main>

            {/* Menú Lateral Móvil */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[3000] lg:hidden animate-in fade-in">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)} />
                    <aside className="absolute right-0 top-0 h-full w-[300px] p-8 flex flex-col gap-8 animate-in slide-in-from-right" style={{ backgroundColor: colors.dark }}>
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <img src="/lodo.png" className="h-8" alt="LODO" />
                            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="text-white">
                                <X />
                            </Button>
                        </div>
                        <nav className="flex flex-col gap-4">
                            <Button
                                variant="ghost"
                                className="justify-start font-black text-white hover:bg-[#6FEA44] hover:text-[#59595B]"
                                onClick={() => { navigate('/map'); setIsMobileMenuOpen(false); }}
                            >
                                <Map className="mr-4" /> MAPA
                            </Button>
                            {isAdmin && (
                                <>
                                    <Button
                                        variant="ghost"
                                        className="justify-start font-black text-white hover:bg-[#6FEA44] hover:text-[#59595B]"
                                        onClick={() => { navigate('/admin/stats'); setIsMobileMenuOpen(false); }}
                                    >
                                        <BarChart3 className="mr-4" /> ESTADÍSTICAS
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="justify-start font-black text-white hover:bg-[#6FEA44] hover:text-[#59595B]"
                                        onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}
                                    >
                                        <Settings className="mr-4" /> ADMINISTRADOR
                                    </Button>
                                </>
                            )}
                        </nav>
                    </aside>
                </div>
            )}

            <Button
                className="lg:hidden fixed bottom-6 right-6 z-[2100] shadow-2xl rounded-full h-14 w-14 border border-white/10"
                style={{ backgroundColor: colors.green, color: colors.dark }}
                onClick={() => setIsMobileMenuOpen(true)}
            >
                <Menu />
            </Button>
        </div>
    );
}