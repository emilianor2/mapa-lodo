import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Download,
    FileSpreadsheet,
    FolderOpen,
    Clipboard,
    UploadCloud,
    ShieldX
} from 'lucide-react';
import { toast } from 'sonner';
import AppShell from '../components/layout/AppShell';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';

const GOOGLE_SHEET_DOWNLOAD_URL = 'https://docs.google.com/spreadsheets/d/1PrRrKP-Nz8lHZOkVhvln2sP6sACod2KxN6SpHQooS6s/export?format=xlsx&gid=1025562372';
const DESKTOP_LAUNCHER_PATH = 'C:\\Users\\Usuario\\Desktop\\LODO-main\\cargadb\\Abrir_Gestor_Excel.bat';

function StepCard({ icon: Icon, title, body, children }) {
    return (
        <div className="rounded-[2rem] border bg-white p-6 shadow-sm" style={{ borderColor: '#59595B10' }}>
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: '#6FEA4415' }}>
                    <Icon className="h-5 w-5" style={{ color: '#6FEA44' }} />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: '#59595B' }}>{title}</h3>
                    <p className="mt-1 text-sm opacity-70" style={{ color: '#59595B' }}>{body}</p>
                </div>
            </div>
            {children}
        </div>
    );
}

export default function AdminImportPage() {
    const navigate = useNavigate();
    const { isAdmin, loading, user } = useAuth();
    const [selectedFileName, setSelectedFileName] = useState('');

    const handleDownloadExcel = () => {
        window.open(GOOGLE_SHEET_DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
    };

    const handleCopyPath = async (value, label) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`${label} copiada`);
        } catch {
            toast.error(`No se pudo copiar ${label.toLowerCase()}`);
        }
    };

    if (loading) {
        return (
            <AppShell>
                <div className="flex h-full items-center justify-center" style={{ backgroundColor: '#f4f4f5' }}>
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2" style={{ borderColor: '#6FEA44' }} />
                        <p style={{ color: '#59595B' }}>Cargando importador...</p>
                    </div>
                </div>
            </AppShell>
        );
    }

    if (!isAdmin) {
        return (
            <AppShell>
                <div className="flex h-full items-center justify-center" style={{ backgroundColor: '#f4f4f5' }}>
                    <div className="max-w-md rounded-[2.5rem] border bg-white p-12 text-center shadow-xl" style={{ borderColor: '#59595B10' }}>
                        <div className="mx-auto mb-10 w-fit rounded-full p-5" style={{ backgroundColor: '#59595B08' }}>
                            <ShieldX className="h-12 w-12" style={{ color: '#59595B' }} />
                        </div>
                        <h2 className="mb-4 text-3xl font-black tracking-tighter" style={{ color: '#59595B' }}>Acceso denegado</h2>
                        <p className="mb-10 text-[10px] font-bold uppercase tracking-widest leading-relaxed opacity-60" style={{ color: '#59595B' }}>
                            Esta vista es solo para administradores.
                            <br />
                            <span className="text-[10px]">Conectado como: {user?.email}</span>
                        </p>
                        <Button onClick={() => navigate('/admin')} className="rounded-xl px-8 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: '#6FEA44', color: '#000' }}>
                            Volver al admin
                        </Button>
                    </div>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="min-h-full p-10 md:p-12" style={{ backgroundColor: '#f4f4f5' }}>
                <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-60" style={{ color: '#59595B' }}>
                            Administración de startups
                        </p>
                        <h1 className="text-4xl font-black tracking-tighter" style={{ color: '#59595B' }}>
                            Importador de Excel
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-relaxed opacity-70" style={{ color: '#59595B' }}>
                            Desde acá podés descargar el Excel actual del ecosistema, editarlo y después procesarlo con el gestor local que valida
                            países, regiones, duplicados y separa lo nuevo de lo modificado antes de subir.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin')}
                        className="rounded-xl text-[10px] font-black uppercase tracking-widest"
                        style={{ color: '#59595B' }}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <StepCard
                        icon={Download}
                        title="1. Descargar Excel actual"
                        body="Bajá el archivo más reciente desde la hoja fuente que usa hoy el proyecto."
                    >
                        <div className="space-y-3">
                            <Button
                                onClick={handleDownloadExcel}
                                className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest"
                                style={{ backgroundColor: '#6FEA44', color: '#000' }}
                            >
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Descargar Excel actual
                            </Button>
                            <p className="text-[11px] opacity-60" style={{ color: '#59595B' }}>
                                Se descarga el mismo Google Sheet que hoy usamos como fuente maestra.
                            </p>
                        </div>
                    </StepCard>

                    <StepCard
                        icon={FolderOpen}
                        title="2. Procesar y revisar"
                        body="Abrí el gestor local para comparar el archivo contra la base actual y aplicar todos los controles."
                    >
                        <div className="space-y-3">
                            <div className="rounded-2xl border bg-[#59595B05] p-4 text-[11px] leading-relaxed" style={{ borderColor: '#59595B10', color: '#59595B' }}>
                                <p className="mb-2 font-black uppercase tracking-[0.16em]">Abrir gestor</p>
                                <p>{DESKTOP_LAUNCHER_PATH}</p>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => handleCopyPath(DESKTOP_LAUNCHER_PATH, 'Ruta del gestor')}
                                className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest"
                                style={{ color: '#59595B' }}
                            >
                                <Clipboard className="mr-2 h-4 w-4" />
                                Copiar ruta del gestor
                            </Button>
                            <p className="text-[11px] opacity-60" style={{ color: '#59595B' }}>
                                El gestor detecta startups nuevas, startups que ya existen y startups existentes con cambios.
                            </p>
                        </div>
                    </StepCard>

                    <StepCard
                        icon={UploadCloud}
                        title="3. Subir cambios"
                        body="La revisión fuerte y la subida viven en el gestor local para mantener la limpieza y validación del pipeline."
                    >
                        <div className="space-y-4">
                            <div className="rounded-2xl border bg-[#6FEA4410] p-4 text-[11px] leading-relaxed" style={{ borderColor: '#6FEA4425', color: '#59595B' }}>
                                <p className="mb-2 font-black uppercase tracking-[0.16em]">Flujo recomendado</p>
                                <p>1. Descargar Excel</p>
                                <p>2. Editarlo y guardar cambios</p>
                                <p>3. Abrir el gestor local</p>
                                <p>4. Procesar y revisar nuevas o modificadas</p>
                                <p>5. Subir nuevas o actualizar existentes revisadas</p>
                            </div>

                            <div className="rounded-2xl border bg-white p-4" style={{ borderColor: '#59595B10' }}>
                                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: '#59595B' }}>
                                    Archivo a procesar
                                </p>
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls,.xlsm"
                                    onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name || '')}
                                    className="block w-full text-sm"
                                />
                                <p className="mt-3 text-[11px] opacity-60" style={{ color: '#59595B' }}>
                                    {selectedFileName ? `Seleccionado: ${selectedFileName}` : 'Podés usar tu Excel real descargado y editado.'}
                                </p>
                            </div>
                        </div>
                    </StepCard>
                </div>

                <div className="mt-8 rounded-[2rem] border bg-white p-8 shadow-sm" style={{ borderColor: '#59595B10' }}>
                    <div className="max-w-5xl">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-60" style={{ color: '#59595B' }}>
                            Cómo funciona
                        </p>
                        <h2 className="text-2xl font-black tracking-tighter" style={{ color: '#59595B' }}>
                            Guía simple para trabajar con el Excel
                        </h2>
                        <p className="mt-4 text-sm leading-relaxed opacity-75" style={{ color: '#59595B' }}>
                            Esta vista está pensada para la persona que administra el listado de startups. La lógica es siempre trabajar sobre el
                            Excel más reciente, procesarlo con el gestor y recién ahí decidir qué se carga. Así evitamos subir errores, duplicados
                            o cambios no revisados.
                        </p>

                        <div className="mt-8 grid gap-6 lg:grid-cols-2">
                            <div className="rounded-[1.5rem] border bg-[#59595B05] p-6" style={{ borderColor: '#59595B10' }}>
                                <h3 className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: '#59595B' }}>
                                    Orden recomendado
                                </h3>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed opacity-80" style={{ color: '#59595B' }}>
                                    <p><strong>1.</strong> Descargá el Excel actual desde esta página.</p>
                                    <p><strong>2.</strong> Hacé los cambios en ese archivo y guardalo en tu computadora.</p>
                                    <p><strong>3.</strong> Abrí el gestor local y elegí ese archivo.</p>
                                    <p><strong>4.</strong> Tocá <strong>Procesar archivo</strong> para que el sistema limpie, compare y prepare la revisión.</p>
                                    <p><strong>5.</strong> Abrí los CSV de revisión, corregí si hace falta y después subí o actualizá.</p>
                                </div>
                            </div>

                            <div className="rounded-[1.5rem] border bg-[#6FEA4410] p-6" style={{ borderColor: '#6FEA4425' }}>
                                <h3 className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: '#59595B' }}>
                                    Qué hace el sistema
                                </h3>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed opacity-80" style={{ color: '#59595B' }}>
                                    <p>Corrige y normaliza países, regiones y ciudades.</p>
                                    <p>Detecta si una startup es nueva o si ya existe.</p>
                                    <p>Separa las existentes que tuvieron cambios.</p>
                                    <p>Genera archivos de revisión antes de tocar la base.</p>
                                    <p>Sube exactamente los CSV revisados que guardaste.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 grid gap-6 lg:grid-cols-3">
                            <div className="rounded-[1.5rem] border p-6" style={{ borderColor: '#59595B10' }}>
                                <h3 className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: '#59595B' }}>
                                    Si agregaste startups nuevas
                                </h3>
                                <p className="mt-4 text-sm leading-relaxed opacity-80" style={{ color: '#59595B' }}>
                                    El gestor genera un archivo con solo esas nuevas. Si lo abrís, cambiás algo y lo guardás, ese mismo archivo es el
                                    que se usa cuando tocás el botón para subir nuevas.
                                </p>
                            </div>

                            <div className="rounded-[1.5rem] border p-6" style={{ borderColor: '#59595B10' }}>
                                <h3 className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: '#59595B' }}>
                                    Si cambiaste startups existentes
                                </h3>
                                <p className="mt-4 text-sm leading-relaxed opacity-80" style={{ color: '#59595B' }}>
                                    El gestor arma otro archivo con las startups existentes que detectó como modificadas. Ese archivo revisado es el que
                                    después se usa para actualizar la base.
                                </p>
                            </div>

                            <div className="rounded-[1.5rem] border p-6" style={{ borderColor: '#59595B10' }}>
                                <h3 className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: '#59595B' }}>
                                    Qué no hace solo
                                </h3>
                                <p className="mt-4 text-sm leading-relaxed opacity-80" style={{ color: '#59595B' }}>
                                    No reemplaza toda la base completa ni sube cambios sin revisión. La idea es que siempre puedas ver primero qué va a
                                    entrar y qué va a actualizarse.
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 rounded-[1.5rem] border bg-[#59595B05] p-6" style={{ borderColor: '#59595B10' }}>
                            <h3 className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: '#59595B' }}>
                                Resumen rápido
                            </h3>
                            <div className="mt-4 space-y-2 text-sm leading-relaxed opacity-80" style={{ color: '#59595B' }}>
                                <p><strong>Descargar:</strong> bajás el Excel más actual.</p>
                                <p><strong>Editar:</strong> hacés cambios en ese mismo archivo.</p>
                                <p><strong>Procesar:</strong> el gestor limpia y compara.</p>
                                <p><strong>Revisar:</strong> abrís los CSV de nuevas o modificadas y corregís si hace falta.</p>
                                <p><strong>Subir:</strong> el sistema carga exactamente esos CSV revisados.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
