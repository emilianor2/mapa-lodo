import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, LogIn, LogOut, ArrowLeft, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../auth/LoginModal';

const NavBar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 15);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const lodoGreen = "#6FEA44";
    const lodoDark = "#59595B"; // Gris oscuro del footer
    const lodoLight = "#f4f4f5"; // Gris clarito para inversión

    return (
        <>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;900&display=swap');
                
                .lodo-font { font-family: 'Montserrat', sans-serif; }
                
                .header-wrapper {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 9999;
                    display: flex;
                    justify-content: center;
                    padding: 20px;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .nav-capsule {
                    background-color: ${lodoDark};
                    width: 100%;
                    max-width: 1140px;
                    height: 75px;
                    border-radius: 100px;
                    display: flex;
                    align-items: center;
                    padding: 0 35px;
                    transition: all 0.4s ease;
                    border: 1px solid rgba(255,255,255,0.08);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                }

                .header-wrapper.scrolled .nav-capsule {
                    max-width: 950px;
                    height: 65px;
                    background: rgba(89, 89, 91, 0.95);
                    backdrop-filter: blur(10px);
                }

                /* BOTÓN VER MAPA: EFECTO ESPEJO */
                .btn-mapa-lodo {
                    background-color: ${lodoGreen};
                    color: ${lodoDark};
                    font-weight: 800;
                    font-size: 13px;
                    padding: 0 25px;
                    height: 42px;
                    border-radius: 50px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border: none;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn-mapa-lodo:hover {
                    background-color: ${lodoLight};
                    color: ${lodoGreen};
                    transform: translateY(-2px);
                }

                /* BOTONES SECUNDARIOS UNIFICADOS */
                .nav-btn-secondary {
                    color: white;
                    font-weight: 700;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: none;
                    border: none;
                    cursor: pointer;
                }
                .nav-btn-secondary:hover {
                    color: ${lodoGreen};
                }

                .logo-container {
                    height: 45px;
                    display: flex;
                    align-items: center;
                    transition: height 0.3s ease;
                }
                `}
            </style>

            <header className={`header-wrapper ${isScrolled ? 'scrolled' : ''}`}>
                <nav className="nav-capsule lodo-font">
                    <div className="w-full flex items-center justify-between">
                        
                        {/* IZQUIERDA: Logo y Web principal */}
                        <div className="flex items-center gap-10">
                            <div className="logo-container cursor-pointer" onClick={() => navigate('/')}>
                                <img 
                                    src="/lodo.png" 
                                    alt="LODO" 
                                    className={`object-contain transition-all duration-300 ${isScrolled ? 'h-[28px]' : 'h-[35px]'}`}
                                />
                            </div>
                            <a href="https://espaciolodo.com" className="hidden md:flex nav-btn-secondary">
                                <ArrowLeft size={16} /> 
                                <span>Web principal</span>
                            </a>
                        </div>

                        {/* DERECHA: Acciones */}
                        <div className="hidden md:flex items-center gap-6">
                            <button onClick={() => navigate('/map')} className="btn-mapa-lodo">
                                <Map size={18} strokeWidth={2.5} />
                                VER MAPA
                            </button>

                            <div className="h-5 w-[1px] bg-white opacity-20"></div>

                            {!isAuthenticated ? (
                                <button 
                                    onClick={() => setIsLoginOpen(true)} 
                                    className="nav-btn-secondary"
                                >
                                    INICIAR SESIÓN
                                </button>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="text-right leading-tight">
                                        <p className="text-[10px] text-white/40 font-bold uppercase">Usuario</p>
                                        <p className="text-[14px] text-white font-bold">{user?.name}</p>
                                    </div>
                                    <button onClick={logout} className="p-2 text-white/60 hover:text-[#6FEA44] transition-all">
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </nav>
            </header>

            {/* Menú Móvil */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-md md:hidden flex justify-center items-start pt-24 px-6">
                    <div className="bg-[#59595B] w-full max-w-sm rounded-[35px] p-8 flex flex-col gap-6 shadow-2xl relative border border-white/10">
                        <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-5 right-7 text-white/60">
                            <X size={28} />
                        </button>
                        
                        <div className="flex justify-center mb-2">
                             <img src="/lodo.png" alt="LODO" className="h-10 w-auto" />
                        </div>

                        <button onClick={() => { navigate('/map'); setIsMobileMenuOpen(false); }} className="w-full btn-mapa-lodo justify-center h-[52px]">
                            <Map size={20} /> VER MAPA
                        </button>

                        {!isAuthenticated ? (
                            <button onClick={() => { setIsLoginOpen(true); setIsMobileMenuOpen(false); }} className="w-full nav-btn-secondary justify-center py-2 text-base">
                                INICIAR SESIÓN
                            </button>
                        ) : (
                            <div className="flex flex-col items-center gap-4 border-t border-white/10 pt-4">
                                <span className="font-bold text-white">{user?.name}</span>
                                <button onClick={logout} className="text-[#6FEA44] font-bold">Cerrar Sesión</button>
                            </div>
                        )}
                        
                        <a href="https://espaciolodo.com" className="nav-btn-secondary justify-center text-sm mt-4">
                            <ArrowLeft size={14} /> Volver a la web principal
                        </a>
                    </div>
                </div>
            )}

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </>
    );
};

export default NavBar;