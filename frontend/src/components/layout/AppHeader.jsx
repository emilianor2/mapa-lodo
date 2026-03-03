import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Map, Settings, Search, LogIn, LogOut, User, Home, BarChart3 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../auth/LoginModal';

export default function AppHeader({ onSearchChange, searchValue, resultsCount }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [localSearch, setLocalSearch] = useState(searchValue || '');

    const colors = {
        green: "#6FEA44",
        dark: "#59595B",
        white: "#ffffff"
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            if (onSearchChange) onSearchChange(localSearch);
        }, 300);
        return () => clearTimeout(handler);
    }, [localSearch, onSearchChange]);

    // Clase para unificar tipografía y hover: Blanco -> Gris Oscuro sobre Verde Lodo
    const navBtnClass = `lodo-font flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 font-semibold uppercase text-[10px] tracking-[0.1em] text-white hover:bg-[#6FEA44] hover:text-[#59595B] group`;

    return (
        <>
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap');
                  .lodo-font { font-family: 'Montserrat', sans-serif; }`}
            </style>

            <header
                className="sticky top-0 z-[100] w-full border-b backdrop-blur-xl lodo-font"
                style={{
                    backgroundColor: `${colors.dark}FA`,
                    borderColor: 'rgba(255,255,255,0.12)',
                }}
            >
                <div className="container mx-auto flex h-16 items-center justify-between px-4">

                    <div className="flex items-center gap-6">
                        <Link to="/" className="flex items-center transition-all hover:opacity-80 active:scale-95">
                            <img src="/lodo.png" alt="LODO" className="h-9 w-auto object-contain" />
                        </Link>

                        {resultsCount !== undefined && (
                            <div className="hidden xl:flex items-center pl-6 border-l border-white/20 h-6">
                                <span className="text-[10px] font-medium uppercase tracking-widest text-white">
                                    <span style={{ color: colors.green }}>{resultsCount}</span> Organizaciones
                                </span>
                            </div>
                        )}
                    </div>

                    {onSearchChange && (
                        <div className="flex-1 max-w-lg mx-8 hidden md:block">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors text-white group-focus-within:text-[#6FEA44]" />
                                <Input
                                    type="search"
                                    placeholder="Buscar en el ecosistema..."
                                    className="lodo-font pl-10 h-10 w-full border-none font-medium text-xs rounded-2xl bg-white/10 text-white placeholder:text-white/40 focus:bg-white/20 transition-all"
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 mr-2 border-r border-white/20 pr-2">

                            {location.pathname !== '/' && (
                                <button onClick={() => navigate('/')} className={navBtnClass}>
                                    <Home className="h-4 w-4 text-white group-hover:text-[#59595B]" />
                                    <span>Inicio</span>
                                </button>
                            )}

                            <button onClick={() => navigate('/map')} className={navBtnClass}>
                                <Map className="h-4 w-4 text-white group-hover:text-[#59595B]" />
                                <span>Mapa</span>
                            </button>

                            {isAdmin && (
                                <>
                                    <button onClick={() => navigate('/admin/stats')} className={navBtnClass}>
                                        <BarChart3 className="h-4 w-4 text-white group-hover:text-[#59595B]" />
                                        <span>Estadísticas</span>
                                    </button>
                                    <button onClick={() => navigate('/admin')} className={navBtnClass}>
                                        <Settings className="h-4 w-4 text-white group-hover:text-[#59595B]" />
                                        <span>Administrador</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                <div className="hidden lg:flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-white uppercase leading-none">{user?.name}</span>
                                    <span className="text-[8px] font-medium text-[#6FEA44] uppercase tracking-widest">
                                        {isAdmin ? 'Administrador' : 'Usuario'}
                                    </span>
                                </div>
                                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[#6FEA44] text-[#59595B] font-extrabold text-[11px] shadow-inner transition-transform hover:scale-110">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <button onClick={logout} className="text-white hover:text-rose-400 transition-colors ml-1 active:scale-95">
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => setIsLoginOpen(true)}
                                className="lodo-font font-extrabold uppercase text-[10px] tracking-[0.12em] rounded-xl px-6 h-9 transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-[#6FEA4415]"
                                style={{ backgroundColor: colors.green, color: colors.dark }}
                            >
                                Entrar
                            </Button>
                        )}
                    </div>
                </div>
            </header>
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </>
    );
}