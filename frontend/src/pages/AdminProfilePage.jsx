import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, KeyRound, ShieldX, UserCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AppShell from '../components/layout/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';

export default function AdminProfilePage() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const { user, isAdmin, loading, profilePhoto, saveProfilePhoto, removeProfilePhoto, changePassword } = useAuth();
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [savingPassword, setSavingPassword] = useState(false);

    const handleSelectPhoto = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Elegí una imagen válida');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('La foto debe pesar menos de 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            saveProfilePhoto(reader.result);
            toast.success('Foto de perfil guardada en este navegador');
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();

        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast.error('Completá todos los campos');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('La confirmación no coincide');
            return;
        }

        setSavingPassword(true);
        try {
            await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            toast.success('Contraseña actualizada');
        } catch (error) {
            toast.error(error.message || 'No se pudo actualizar la contraseña');
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return (
            <AppShell>
                <div className="flex h-full items-center justify-center" style={{ backgroundColor: '#f4f4f5' }}>
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2" style={{ borderColor: '#6FEA44' }} />
                        <p style={{ color: '#59595B' }}>Cargando perfil...</p>
                    </div>
                </div>
            </AppShell>
        );
    }

    if (!isAdmin) {
        return (
            <AppShell>
                <div className="flex h-full items-center justify-center" style={{ backgroundColor: '#f4f4f5' }}>
                    <div className="max-w-md p-12 text-center bg-white rounded-[2.5rem] shadow-xl border" style={{ borderColor: '#59595B10' }}>
                        <div className="mx-auto mb-10 w-fit rounded-full p-5" style={{ backgroundColor: '#59595B08' }}>
                            <ShieldX className="h-12 w-12" style={{ color: '#59595B' }} />
                        </div>
                        <h2 className="mb-4 text-3xl font-black tracking-tighter" style={{ color: '#59595B' }}>Acceso Denegado</h2>
                        <p className="mb-10 font-bold uppercase tracking-widest text-[10px] leading-relaxed opacity-60" style={{ color: '#59595B' }}>
                            Esta vista es solo para administradores.
                        </p>
                        <Button onClick={() => navigate('/admin')} className="font-black uppercase text-[10px] tracking-widest px-8 rounded-xl" style={{ backgroundColor: '#6FEA44', color: '#000' }}>
                            Volver al administrador
                        </Button>
                    </div>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="min-h-full p-10 md:p-12" style={{ backgroundColor: '#f4f4f5' }}>
                <div className="mb-10">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-60" style={{ color: '#59595B' }}>
                        Perfil de administrador
                    </p>
                    <h1 className="text-4xl font-black tracking-tighter" style={{ color: '#59595B' }}>
                        Tu perfil
                    </h1>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                    <section className="rounded-[2rem] border bg-white p-6 shadow-sm" style={{ borderColor: '#59595B10' }}>
                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                {profilePhoto ? (
                                    <img
                                        src={profilePhoto}
                                        alt="Foto de perfil"
                                        className="h-32 w-32 rounded-full object-cover border-4"
                                        style={{ borderColor: '#6FEA4420' }}
                                    />
                                ) : (
                                    <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 bg-[#59595B08]" style={{ borderColor: '#6FEA4420' }}>
                                        <UserCircle2 className="h-20 w-20" style={{ color: '#59595B55' }} />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
                                    style={{ backgroundColor: '#6FEA44', color: '#000' }}
                                >
                                    <Camera className="h-4 w-4" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleSelectPhoto}
                                />
                            </div>

                            <h2 className="text-2xl font-black tracking-tight" style={{ color: '#59595B' }}>{user?.name}</h2>
                            <p className="mt-2 text-sm font-medium opacity-70" style={{ color: '#59595B' }}>{user?.email}</p>
                            <p className="mt-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]" style={{ backgroundColor: '#6FEA4415', color: '#2DA01D' }}>
                                {user?.role}
                            </p>

                            <div className="mt-8 flex w-full flex-col gap-3">
                                <Button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="font-black uppercase text-[10px] tracking-widest rounded-xl"
                                    style={{ backgroundColor: '#6FEA44', color: '#000' }}
                                >
                                    Cambiar foto
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        removeProfilePhoto();
                                        toast.success('Foto eliminada de este navegador');
                                    }}
                                    className="font-black uppercase text-[10px] tracking-widest rounded-xl"
                                    style={{ color: '#59595B' }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Quitar foto
                                </Button>
                            </div>

                            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] opacity-40" style={{ color: '#59595B' }}>
                                La foto se guarda solo en este navegador
                            </p>
                        </div>
                    </section>

                    <section className="rounded-[2rem] border bg-white p-6 shadow-sm" style={{ borderColor: '#59595B10' }}>
                        <div className="mb-8 flex items-center gap-3">
                            <KeyRound className="h-5 w-5" style={{ color: '#6FEA44' }} />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: '#59595B' }}>
                                Seguridad
                            </h3>
                        </div>

                        <form className="grid gap-5 max-w-xl" onSubmit={handlePasswordSubmit}>
                            <div className="grid gap-2">
                                <Label htmlFor="currentPassword">Contraseña actual</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="newPassword">Nueva contraseña</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                                />
                            </div>

                            <div className="pt-2 flex flex-wrap gap-3">
                                <Button
                                    type="submit"
                                    disabled={savingPassword}
                                    className="font-black uppercase text-[10px] tracking-widest rounded-xl"
                                    style={{ backgroundColor: '#6FEA44', color: '#000' }}
                                >
                                    {savingPassword ? 'Guardando...' : 'Actualizar contraseña'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => navigate('/admin')}
                                    className="font-black uppercase text-[10px] tracking-widest rounded-xl"
                                    style={{ color: '#59595B' }}
                                >
                                    Volver
                                </Button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </AppShell>
    );
}
