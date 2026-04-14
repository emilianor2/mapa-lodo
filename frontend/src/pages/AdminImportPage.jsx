import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ExternalLink, RefreshCw, ShieldX, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import AppShell from '../components/layout/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { adminCommitDriveImport, adminPreviewDriveImport } from '../services/api';

const GOOGLE_SHEET_EDIT_URL = 'https://docs.google.com/spreadsheets/d/1PrRrKP-Nz8lHZOkVhvln2sP6sACod2KxN6SpHQooS6s/edit?gid=1025562372#gid=1025562372';

const ORGANIZATION_TYPE_OPTIONS = [
    { value: 'startup', label: 'Startup' },
    { value: 'public_entity', label: 'Entidad publica' },
    { value: 'ngo', label: 'ONG' },
    { value: 'corporate', label: 'Corporativa' },
    { value: 'otra', label: 'Otra' }
];

const OUTCOME_STATUS_OPTIONS = [
    { value: 'active', label: 'Activa' },
    { value: 'acquired', label: 'Adquirida' },
    { value: 'closed', label: 'Cerrada' },
    { value: 'unknown', label: 'Sin dato' }
];

function StepCard({ title, body, icon: Icon, children }) {
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

function StatCard({ label, value }) {
    return (
        <div className="rounded-[1.5rem] border bg-white p-5 shadow-sm" style={{ borderColor: '#59595B10' }}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60" style={{ color: '#59595B' }}>{label}</p>
            <p className="mt-3 text-3xl font-black tracking-tighter" style={{ color: '#59595B' }}>{value}</p>
        </div>
    );
}

function Pill({ text, tone = 'neutral' }) {
    const styles = tone === 'success'
        ? { borderColor: '#6FEA4430', color: '#2f7d19', backgroundColor: '#6FEA4410' }
        : tone === 'warning'
            ? { borderColor: '#f59e0b30', color: '#a16207', backgroundColor: '#f59e0b10' }
            : tone === 'danger'
                ? { borderColor: '#ef444430', color: '#b91c1c', backgroundColor: '#ef444410' }
                : { borderColor: '#59595B15', color: '#59595B', backgroundColor: '#fff' };

    return (
        <span className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]" style={styles}>
            {text}
        </span>
    );
}

function buildPublishChecklist(entry) {
    const missing = [];
    if (!entry.name?.trim()) missing.push('Nombre');
    if (!entry.website?.trim()) missing.push('Website');
    if (!entry.country?.trim()) missing.push('Pais');
    if (!entry.vertical?.trim()) missing.push('Vertical');
    if (!entry.organizationType?.trim()) missing.push('Tipo de organizacion');
    if (!entry.outcomeStatus?.trim()) missing.push('Outcome');
    if ((entry.vertical || '').trim().toLowerCase() === 'otra' && !(entry.notes || '').trim()) {
        missing.push('Notas para vertical "otra"');
    }

    return {
        missing,
        canPublish: missing.length === 0
    };
}

function fieldClass(isMissing) {
    return isMissing ? 'bg-white border-rose-300 ring-1 ring-rose-200' : 'bg-white border-emerald-200';
}

function buildWarnings(entry) {
    const checklist = buildPublishChecklist(entry);
    return {
        checklist,
        shouldReview: !checklist.canPublish
    };
}

export default function AdminImportPage() {
    const navigate = useNavigate();
    const { isAdmin, loading, user } = useAuth();
    const [preview, setPreview] = useState(null);
    const [editableEntries, setEditableEntries] = useState([]);
    const [isReviewing, setIsReviewing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const previewEntries = editableEntries;
    const skippedEntries = preview?.skippedEntries || [];

    const warningCount = useMemo(
        () => previewEntries.reduce((acc, item) => acc + buildPublishChecklist(item).missing.length + (item.warnings?.length || 0), 0),
        [previewEntries]
    );

    const readyToPublishCount = useMemo(
        () => previewEntries.filter((entry) => buildPublishChecklist(entry).canPublish).length,
        [previewEntries]
    );

    const openDrive = () => {
        window.open(GOOGLE_SHEET_EDIT_URL, '_blank', 'noopener,noreferrer');
    };

    const reviewDrive = async () => {
        setIsReviewing(true);
        try {
            const result = await adminPreviewDriveImport();
            setPreview(result);
            setEditableEntries(
                (result?.previewEntries || []).map((entry) => ({
                    ...entry,
                    vertical: entry.vertical || '',
                    subVertical: entry.subVertical || '',
                    organizationType: entry.organizationType || 'startup',
                    outcomeStatus: entry.outcomeStatus || 'active',
                    website: entry.website || '',
                    country: entry.country || '',
                    region: entry.region || '',
                    city: entry.city || '',
                    solucion: entry.solucion || '',
                    notes: entry.notes || '',
                    mail: entry.mail || ''
                }))
            );

            if ((result?.newRows || 0) === 0) {
                toast.success('No se encontraron startups nuevas en el Drive');
            } else {
                toast.success(`Se encontraron ${result.newRows} startups nuevas`);
            }
        } catch (error) {
            toast.error(error.message || 'No se pudo revisar el Drive');
        } finally {
            setIsReviewing(false);
        }
    };

    const importNewEntries = async () => {
        if (!previewEntries.length) {
            toast.error('No hay startups nuevas para subir');
            return;
        }

        setIsImporting(true);
        try {
            const result = await adminCommitDriveImport(previewEntries);
            const created = result.created || 0;
            const published = result.published || 0;
            const inReview = result.inReview || 0;
            const failed = (result.results || []).filter((item) => item.status === 'error');

            if (created > 0) {
                toast.success(`Se importaron ${created}. Publicadas: ${published}. En revision: ${inReview}.`);
            }

            if (failed.length > 0) {
                toast.error(`No se pudieron subir ${failed.length}. ${failed[0]?.error || 'Error de importacion'}`);
            }

            if (created === 0 && failed.length === 0) {
                toast.error('No se importo ninguna startup nueva');
            }

            await reviewDrive();
        } catch (error) {
            toast.error(error.message || 'No se pudo importar desde el Drive');
        } finally {
            setIsImporting(false);
        }
    };

    const updateEntry = (index, key, value) => {
        setEditableEntries((prev) => prev.map((entry, currentIndex) => (
            currentIndex === index ? { ...entry, [key]: value } : entry
        )));
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
                            Administracion de startups
                        </p>
                        <h1 className="text-4xl font-black tracking-tighter" style={{ color: '#59595B' }}>
                            Revision desde Drive
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-relaxed opacity-70" style={{ color: '#59595B' }}>
                            Editas el Google Sheet en Drive, volves aca, revisas las nuevas una por una y completas desde esta misma pagina lo necesario para que queden publicables o pasen a revision.
                        </p>
                    </div>
                    <Button variant="ghost" onClick={() => navigate('/admin')} className="rounded-xl text-[10px] font-black uppercase tracking-widest" style={{ color: '#59595B' }}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <StepCard icon={ExternalLink} title="1. Abrir Drive" body="Entra al Google Sheet, agrega o corrige startups y guarda ahi mismo.">
                        <Button onClick={openDrive} className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: '#6FEA44', color: '#000' }}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Abrir Google Sheet
                        </Button>
                    </StepCard>

                    <StepCard icon={RefreshCw} title="2. Revisar nuevas" body="La web compara el Drive contra la base y muestra solo startups nuevas.">
                        <Button
                            onClick={reviewDrive}
                            disabled={isReviewing}
                            className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest"
                            style={{ backgroundColor: '#59595B', color: '#fff' }}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${isReviewing ? 'animate-spin' : ''}`} />
                            {isReviewing ? 'Revisando Drive...' : 'Revisar nuevas startups del Drive'}
                        </Button>
                    </StepCard>

                    <StepCard icon={UploadCloud} title="3. Confirmar subida" body="Las completas se publican si geocodifican; las incompletas quedan en revision.">
                        <Button
                            onClick={importNewEntries}
                            disabled={isImporting || !previewEntries.length}
                            className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest"
                            style={{ backgroundColor: '#6FEA44', color: '#000' }}
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {isImporting ? 'Subiendo nuevas...' : 'Confirmar y subir nuevas'}
                        </Button>
                    </StepCard>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-5">
                    <StatCard label="Filas del Drive" value={preview?.totalRows ?? '-'} />
                    <StatCard label="Nuevas" value={preview?.newRows ?? '-'} />
                    <StatCard label="Ya existentes" value={preview?.existingRows ?? '-'} />
                    <StatCard label="Advertencias" value={preview ? warningCount : '-'} />
                    <StatCard label="Listas para publicar" value={preview ? readyToPublishCount : '-'} />
                </div>

                <div className="mt-8 rounded-[2rem] border bg-white p-8 shadow-sm" style={{ borderColor: '#59595B10' }}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60" style={{ color: '#59595B' }}>
                                Resultado
                            </p>
                            <h2 className="mt-2 text-2xl font-black tracking-tighter" style={{ color: '#59595B' }}>
                                Revision automatica del Drive
                            </h2>
                        </div>
                        {preview?.sourceUrl ? (
                            <a href={preview.sourceUrl} target="_blank" rel="noreferrer" className="text-[11px] font-black uppercase tracking-[0.14em] opacity-60" style={{ color: '#59595B' }}>
                                Ver export actual
                            </a>
                        ) : null}
                    </div>

                    {!preview ? (
                        <p className="mt-6 text-sm leading-relaxed opacity-70" style={{ color: '#59595B' }}>
                            Aca vas a ver las startups nuevas detectadas y que les falta para quedar publicadas. Podes completar website, vertical, pais, tipo de organizacion, outcome y notas antes de subir.
                        </p>
                    ) : previewEntries.length === 0 ? (
                        <div className="mt-6 rounded-[1.5rem] border bg-[#59595B05] p-6 text-sm leading-relaxed opacity-80" style={{ borderColor: '#59595B10', color: '#59595B' }}>
                            No se encontraron startups nuevas. El Drive y la base ya estan alineados, o bien las filas nuevas no tienen nombre.
                        </div>
                    ) : (
                        <div className="mt-6 space-y-4">
                            {previewEntries.map((entry, index) => {
                                const { checklist, shouldReview } = buildWarnings(entry);

                                return (
                                    <div
                                        key={`${entry.sourceRowNumber}-${entry.name}`}
                                        className="rounded-[1.5rem] border p-5"
                                        style={{ borderColor: shouldReview ? '#f59e0b55' : '#6FEA4455', backgroundColor: shouldReview ? '#fffaf0' : '#f8fff6' }}
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-50" style={{ color: '#59595B' }}>
                                                    Fila {entry.sourceRowNumber}
                                                </p>
                                                <h3 className="mt-2 text-xl font-black tracking-tight" style={{ color: '#59595B' }}>
                                                    {entry.name || 'Sin nombre'}
                                                </h3>
                                                <p className="mt-2 text-sm opacity-75" style={{ color: '#59595B' }}>
                                                    {[entry.country || 'S/D', entry.region || 'S/D', entry.city || 'S/D'].join(' · ')}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Pill text={checklist.canPublish ? 'Lista para publicar' : 'Quedara en revision'} tone={checklist.canPublish ? 'success' : 'warning'} />
                                                {(entry.warnings || []).map((warning) => (
                                                    <Pill key={warning} text={warning} tone="danger" />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                                            <div className="rounded-2xl bg-[#59595B05] p-4 space-y-3">
                                                <div>
                                                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] opacity-60" style={{ color: '#59595B' }}>Website</p>
                                                    <Input value={entry.website} onChange={(e) => updateEntry(index, 'website', e.target.value)} className={fieldClass(!entry.website?.trim())} placeholder="https://..." />
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] opacity-60" style={{ color: '#59595B' }}>Vertical</p>
                                                    <Input value={entry.vertical} onChange={(e) => updateEntry(index, 'vertical', e.target.value)} className={fieldClass(!entry.vertical?.trim())} placeholder="agtech / biotech..." />
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] opacity-60" style={{ color: '#59595B' }}>Subvertical</p>
                                                    <Input value={entry.subVertical} onChange={(e) => updateEntry(index, 'subVertical', e.target.value)} className="bg-white border-slate-200" placeholder="Opcional" />
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] opacity-60" style={{ color: '#59595B' }}>Mail</p>
                                                    <Input value={entry.mail} onChange={(e) => updateEntry(index, 'mail', e.target.value)} className="bg-white border-slate-200" placeholder="Opcional" />
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] opacity-60" style={{ color: '#59595B' }}>Solucion</p>
                                                    <Input value={entry.solucion} onChange={(e) => updateEntry(index, 'solucion', e.target.value)} className="bg-white border-slate-200" placeholder="Opcional" />
                                                </div>
                                                {(entry.vertical || '').trim().toLowerCase() === 'otra' ? (
                                                    <div>
                                                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] opacity-60" style={{ color: '#59595B' }}>Notas de categoria</p>
                                                        <Input value={entry.notes || ''} onChange={(e) => updateEntry(index, 'notes', e.target.value)} className={fieldClass(!(entry.notes || '').trim())} placeholder="Obligatorio si vertical es otra" />
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="rounded-2xl bg-[#59595B05] p-4 space-y-3">
                                                <div className="grid gap-3 md:grid-cols-2">
                                                    <div>
                                                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] opacity-60" style={{ color: '#59595B' }}>Pais</p>
                                                        <Input value={entry.country} onChange={(e) => updateEntry(index, 'country', e.target.value)} className={fieldClass(!entry.country?.trim())} placeholder="Pais" />
                                                    </div>
                                                    <div>
                                                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] opacity-60" style={{ color: '#59595B' }}>Region</p>
                                                        <Input value={entry.region} onChange={(e) => updateEntry(index, 'region', e.target.value)} className="bg-white border-slate-200" placeholder="Opcional" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] opacity-60" style={{ color: '#59595B' }}>Ciudad</p>
                                                    <Input value={entry.city} onChange={(e) => updateEntry(index, 'city', e.target.value)} className="bg-white border-slate-200" placeholder="Opcional" />
                                                </div>

                                                <div className="grid gap-3 md:grid-cols-2">
                                                    <div>
                                                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] opacity-60" style={{ color: '#59595B' }}>Tipo de organizacion</p>
                                                        <Select value={entry.organizationType} onValueChange={(value) => updateEntry(index, 'organizationType', value)}>
                                                            <SelectTrigger className={fieldClass(!entry.organizationType?.trim())}><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {ORGANIZATION_TYPE_OPTIONS.map((option) => (
                                                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] opacity-60" style={{ color: '#59595B' }}>Outcome</p>
                                                        <Select value={entry.outcomeStatus} onValueChange={(value) => updateEntry(index, 'outcomeStatus', value)}>
                                                            <SelectTrigger className={fieldClass(!entry.outcomeStatus?.trim())}><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {OUTCOME_STATUS_OPTIONS.map((option) => (
                                                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border bg-white p-3 text-sm" style={{ borderColor: '#59595B10', color: '#59595B' }}>
                                                    <strong>Founders:</strong> {(entry.founders || []).length ? entry.founders.join(', ') : 'S/D'}
                                                </div>
                                            </div>
                                        </div>

                                        {!checklist.canPublish ? (
                                            <div className="mt-4 rounded-2xl border bg-white p-4 text-sm" style={{ borderColor: '#f59e0b35', color: '#59595B' }}>
                                                <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-60">Falta para publicar</p>
                                                <p className="mt-2">{checklist.missing.join(', ')}</p>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {skippedEntries.length > 0 ? (
                        <div className="mt-8 rounded-[1.5rem] border bg-[#59595B05] p-6" style={{ borderColor: '#59595B10' }}>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-60" style={{ color: '#59595B' }}>
                                Filas omitidas
                            </p>
                            <div className="mt-3 space-y-2 text-sm opacity-80" style={{ color: '#59595B' }}>
                                {skippedEntries.slice(0, 8).map((item) => (
                                    <p key={`${item.sourceRowNumber}-${item.reason}`}>
                                        Fila {item.sourceRowNumber}: {item.reason}
                                    </p>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </AppShell>
    );
}
