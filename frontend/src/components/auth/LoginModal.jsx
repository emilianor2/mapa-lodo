import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { LogIn, UserPlus, Loader2, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginModal({ isOpen, onClose }) {
    // Colores de marca LODO
    const lodoGreen = "#6FEA44";
    const lodoDark = "#59595B";
    const lodoLight = "#f4f4f5";

    const { login, register } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isRegister) {
                await register(formData.email, formData.password, formData.name);
                toast.success('¡Cuenta creada exitosamente!');
            } else {
                await login(formData.email, formData.password);
                toast.success('¡Bienvenido!');
            }
            onClose();
            setFormData({ email: '', password: '', name: '' });
        } catch (error) {
            toast.error(error.message || 'Error de autenticación');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegister(!isRegister);
        setFormData({ email: '', password: '', name: '' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md" style={{ backgroundColor: lodoLight }}>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-center flex items-center justify-center gap-2" style={{ color: lodoDark }}>
                        {isRegister ? (
                            <>
                                <UserPlus className="h-6 w-6" style={{ color: lodoGreen }} />
                                Crear Cuenta
                            </>
                        ) : (
                            <>
                                <LogIn className="h-6 w-6" style={{ color: lodoGreen }} />
                                Iniciar Sesión
                            </>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {isRegister && (
                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2" style={{ color: lodoDark }}>
                                <User className="h-4 w-4 opacity-70" />
                                Nombre
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Tu nombre"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required={isRegister}
                                className="h-11 bg-white border-slate-200 focus:ring-offset-0"
                                style={{ focusVisibleRing: lodoGreen }}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2" style={{ color: lodoDark }}>
                            <Mail className="h-4 w-4 opacity-70" />
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="h-11 bg-white border-slate-200 focus:ring-offset-0"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="flex items-center gap-2" style={{ color: lodoDark }}>
                            <Lock className="h-4 w-4 opacity-70" />
                            Contraseña
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            minLength={6}
                            className="h-11 bg-white border-slate-200 focus:ring-offset-0"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 font-black uppercase tracking-widest shadow-lg transition-transform active:scale-95"
                        disabled={loading}
                        style={{
                            backgroundColor: lodoGreen,
                            color: "#000000",
                            boxShadow: `${lodoGreen}33 0px 8px 24px`
                        }}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : isRegister ? (
                            <UserPlus className="h-4 w-4 mr-2" />
                        ) : (
                            <LogIn className="h-4 w-4 mr-2" />
                        )}
                        {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
                    </Button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={toggleMode}
                        className="text-sm transition-colors"
                        style={{ color: lodoDark }}
                    >
                        {isRegister ? (
                            <>¿Ya tienes cuenta? <span className="font-bold" style={{ color: lodoGreen }}>Inicia sesión</span></>
                        ) : (
                            <>¿No tienes cuenta? <span className="font-bold" style={{ color: lodoGreen }}>Regístrate</span></>
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}