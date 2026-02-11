import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Map, Settings, Search, Menu, Home, BarChart3 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export default function AppShell({ children, onSearchChange, searchValue, resultsCount }) {
    const location = useLocation();
    const { isAdmin, isAuthenticated } = useAuth();
    const isMapPage = location.pathname.startsWith('/map');
    const isAdminPage = location.pathname.startsWith('/admin');
    const isContactPage = location.pathname.startsWith('/contacto');
    const useUnifiedHeader = isMapPage || isAdminPage;
    const showSearch = !isAdmin && onSearchChange !== undefined;
    const actionButtonClass = 'hidden sm:flex text-white/90 hover:text-[#6FEA44] hover:bg-white/10 transition-colors border border-transparent';
    const activeActionButtonClass = 'hidden sm:flex text-white bg-white/15 hover:bg-white/20 border border-white/20';

    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            {/* Header */}
            <header
                className={`sticky top-0 z-[2200] w-full ${
                    useUnifiedHeader
                        ? 'border-b border-white/15 bg-[#59595B]/95 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.24)]'
                        : 'border-b bg-background/100 backdrop-blur-sm shadow-sm'
                }`}
            >
                <div
                    className={`mx-auto flex items-center justify-between px-4 ${
                        useUnifiedHeader
                            ? 'h-16 w-full text-white'
                            : isContactPage
                                ? 'h-16'
                                : 'h-10'
                    }`}
                >
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group transition-all duration-300 active:scale-95">
                        <img
                            src="/lodo.png"
                            alt="LODO"
                            className={`w-auto object-contain transition-transform duration-300 ${
                                useUnifiedHeader ? 'h-12 group-hover:scale-[1.02]' : 'h-10 group-hover:scale-[1.04]'
                            }`}
                        />
                    </Link>

                    {/* Search (visible on map page) */}
                    {showSearch && (
                        <div className={`flex-1 max-w-xl hidden md:block ${useUnifiedHeader ? 'mx-8' : 'mx-12'}`}>
                            <div className="relative group">
                                <Search
                                    className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
                                        useUnifiedHeader
                                            ? 'text-white/55 group-focus-within:text-[#6FEA44]'
                                            : 'text-muted-foreground group-focus-within:text-primary'
                                    }`}
                                />
                                <Input
                                    type="search"
                                    placeholder="Buscar por nombre, etiquetas, sector..."
                                    className={`pl-10 h-10 transition-all duration-200 ${
                                        useUnifiedHeader
                                            ? 'border-white/15 bg-white/10 text-white placeholder:text-white/50 focus:border-[#6FEA44] focus:bg-white/15'
                                            : 'bg-muted/50 border-transparent focus:bg-background'
                                    }`}
                                    value={searchValue || ''}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Right section */}
                    <div className="flex items-center gap-3">
                        {!isMapPage && (
                            <Link to="/map">
                                <Button variant="ghost" size="sm" className={actionButtonClass}>
                                    <Map className="h-4 w-4 mr-2" />
                                    Ver Mapa
                                </Button>
                            </Link>
                        )}
                        {location.pathname !== '/' && (
                            <Link to="/">
                                <Button variant="ghost" size="sm" className={actionButtonClass}>
                                    <Home className="h-4 w-4 mr-2" />
                                    Volver al Inicio
                                </Button>
                            </Link>
                        )}
                        {/* Add Company button for non-admin users on map page */}
                        {!isAdmin && isAuthenticated && location.pathname.startsWith('/map') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className={actionButtonClass}
                                onClick={() => navigate('/contacto')}
                            >
                                <Map className="h-4 w-4 mr-2" />
                                Agregar Empresa
                            </Button>
                        )}
                        {isAdmin && (
                            <>
                                <Link to="/admin/stats">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={location.pathname.startsWith('/admin/stats') ? activeActionButtonClass : actionButtonClass}
                                    >
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Estadisticas
                                    </Button>
                                </Link>
                                <Link to="/admin">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={location.pathname === '/admin' ? activeActionButtonClass : actionButtonClass}
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        Admin
                                    </Button>
                                </Link>
                            </>
                        )}
                        {/* Mobile menu (simulated) */}
                        <Button variant="ghost" size="icon" className={useUnifiedHeader ? 'md:hidden text-white/90 hover:text-[#6FEA44] hover:bg-white/10' : 'md:hidden'}>
                            <Menu className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main
                className={`flex-1 relative ${
                    isMapPage ? 'overflow-hidden' : 'overflow-y-auto'
                }`}
            >
                {children}
            </main>
        </div>
    );
}
