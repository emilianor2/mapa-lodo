import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '../ui/dropdown-menu';
import {
    MoreHorizontal, Edit, Send, CheckCircle,
    MapPin, ExternalLink, Trash2, Calendar,
    Layers, ChevronLeft, ChevronRight, Trash, Archive
} from 'lucide-react';
import {
    adminSubmitForReview as submitForReview,
    adminPublishOrganization as publishOrganization,
    adminArchiveOrganization as archiveOrganization,
    adminDeleteOrganization as deleteOrganization
} from '../../services/api';
import { toast } from 'sonner';
import ConfirmModal from './ConfirmModal';

const statusConfig = {
    DRAFT: { label: "Borrador", class: "bg-slate-100 text-[#59595B] border-slate-200" },
    IN_REVIEW: { label: "En Revisión", class: "bg-amber-50 text-amber-700 border-amber-200" },
    PUBLISHED: { label: "Publicado", class: "bg-[#6FEA44]/10 text-[#166534] border-[#6FEA44]/20" },
    ARCHIVED: { label: "Archivado", class: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function AdminTable({ organizations, onRefresh, onSelect }) {
    // Definición de colores LODO
    const lodoGreen = "#6FEA44";
    const lodoDark = "#59595B";
    const lodoLight = "#f4f4f5";

    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [orgToDelete, setOrgToDelete] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [selectedIds, setSelectedIds] = React.useState([]);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 15;

    React.useEffect(() => {
        setCurrentPage(1);
        setSelectedIds([]);
    }, [organizations.length]);

    const sortedOrganizations = React.useMemo(() => {
        return [...organizations].sort((a, b) => {
            const verticalA = (a.vertical || "Z").toLowerCase();
            const verticalB = (b.vertical || "Z").toLowerCase();
            if (verticalA < verticalB) return -1;
            if (verticalA > verticalB) return 1;
            return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
        });
    }, [organizations]);

    const totalPages = Math.ceil(sortedOrganizations.length / itemsPerPage);
    const currentItems = sortedOrganizations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getBulkActionConfig = () => {
        if (selectedIds.length === 0) return null;
        const firstSelected = organizations.find(o => o.id === selectedIds[0]);
        if (!firstSelected) return null;

        switch (firstSelected.status) {
            case 'DRAFT':
                return { label: 'Enviar a Revisión', icon: <Send className="h-3.5 w-3.5 mr-2" />, action: submitForReview };
            case 'IN_REVIEW':
                return { label: 'Publicar Selección', icon: <CheckCircle className="h-3.5 w-3.5 mr-2" />, action: publishOrganization };
            case 'PUBLISHED':
                return { label: 'Archivar Selección', icon: <Archive className="h-3.5 w-3.5 mr-2" />, action: archiveOrganization };
            default:
                return { label: 'Enviar a Revisión', icon: <Send className="h-3.5 w-3.5 mr-2" />, action: submitForReview };
        }
    };

    const bulkConfig = getBulkActionConfig();

    const toggleSelectAll = () => {
        if (selectedIds.length === currentItems.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(currentItems.map(item => item.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleAction = async (id, actionFn, label) => {
        const promise = actionFn(id);
        toast.promise(promise, {
            loading: `Ejecutando: ${label}...`,
            success: () => { onRefresh(); return `Exito: ${label}`; },
            error: (err) => {
                if (err.status === 422) {
                    return `Error de validacion: ${err.message}`;
                }
                return `Error: ${err.message}`;
            }
        });
    };

    const handleBulkAction = async (actionFn, label) => {
        setLoading(true);
        try {
            const results = await Promise.allSettled(selectedIds.map(id => actionFn(id)));
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            const errorCount = results.filter(r => r.status === 'rejected').length;

            if (successCount > 0) {
                toast.success(`${successCount} organizaciones procesadas correctamente: ${label}`);
            }
            if (errorCount > 0) {
                toast.error(`${errorCount} organizaciones fallaron. Asegúrese de que tengan todos los campos obligatorios (Geografía/Categoría) antes de procesar.`);
            }
            setSelectedIds([]);
            onRefresh();
        } catch (err) {
            toast.error("Error en proceso masivo");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (org) => {
        setOrgToDelete(org);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!orgToDelete) return;
        setLoading(true);
        try {
            await deleteOrganization(orgToDelete.id, orgToDelete.status === 'ARCHIVED');
            toast.success("Eliminado correctamente");
            onRefresh();
            setIsDeleteModalOpen(false);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {selectedIds.length > 0 && bulkConfig && (
                <div
                    className="flex items-center justify-between border p-3 rounded-lg animate-in fade-in zoom-in duration-200"
                    style={{ backgroundColor: `${lodoGreen}10`, borderColor: `${lodoGreen}30` }}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold" style={{ color: lodoDark }}>{selectedIds.length} seleccionados</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-bold"
                            style={{ borderColor: `${lodoGreen}40`, color: lodoDark }}
                            onClick={() => handleBulkAction(bulkConfig.action, bulkConfig.label)}
                        >
                            {React.cloneElement(bulkConfig.icon, { style: { color: lodoGreen } })} {bulkConfig.label}
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 text-xs font-bold"
                            onClick={() => handleBulkAction(id => deleteOrganization(id, false), 'Borradas/Archivadas')}
                        >
                            <Trash className="h-3.5 w-3.5 mr-2" /> Eliminar
                        </Button>
                    </div>
                </div>
            )}

            <div className="rounded-xl border shadow-sm overflow-hidden bg-white" style={{ borderColor: lodoLight }}>
                <div className="relative w-full overflow-auto text-sm">
                    <Table>
                        <TableHeader className="text-xs" style={{ backgroundColor: lodoLight }}>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        style={{ accentColor: lodoGreen }}
                                        checked={selectedIds.length === currentItems.length && currentItems.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="font-bold w-[230px]" style={{ color: lodoDark }}>Organización / Vertical</TableHead>
                                <TableHead className="font-bold hidden md:table-cell" style={{ color: lodoDark }}>Ubicación e ID</TableHead>
                                <TableHead className="font-bold" style={{ color: lodoDark }}>Estado</TableHead>
                                <TableHead className="font-bold" style={{ color: lodoDark }}>Actualizado</TableHead>
                                <TableHead className="font-bold text-right" style={{ color: lodoDark }}>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                                        No hay datos disponibles.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentItems.map((org, index) => {
                                    const status = statusConfig[org.status] || { label: org.status, class: "" };
                                    const showVerticalHeader = index === 0 || org.vertical !== currentItems[index - 1].vertical;

                                    return (
                                        <React.Fragment key={org.id}>
                                            {showVerticalHeader && (
                                                <TableRow style={{ backgroundColor: `${lodoLight}80` }}>
                                                    <TableCell colSpan={6} className="py-2 px-4 border-y">
                                                        <div className="flex items-center gap-2">
                                                            <Layers className="h-3 w-3 opacity-70" style={{ color: lodoGreen }} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: lodoDark }}>
                                                                {org.vertical || "Sin Sector"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            <TableRow
                                                className="transition-colors"
                                                style={{ backgroundColor: selectedIds.includes(org.id) ? `${lodoGreen}10` : 'transparent' }}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        style={{ accentColor: lodoGreen }}
                                                        checked={selectedIds.includes(org.id)}
                                                        onCheckedChange={() => toggleSelect(org.id)}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold truncate max-w-[180px]" style={{ color: lodoDark }}>{org.name || "S/N"}</span>
                                                        <span className="text-[10px] text-muted-foreground md:hidden truncate">
                                                            {org.city || 'S/D'}, {org.country || 'S/D'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                                            <MapPin className="h-3 w-3" style={{ color: lodoGreen }} />
                                                            {org.city || 'S/D'}, {org.country || 'S/D'}
                                                        </div>
                                                        <code className="text-[9px] opacity-40 font-mono tracking-tighter">{org.id}</code>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`text-[9px] font-bold h-5 px-2 ${status.class}`}>
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground whitespace-nowrap">
                                                        <Calendar className="h-3 w-3" />
                                                        {org.updatedAt ? new Date(org.updatedAt).toLocaleDateString() : "S/D"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => onSelect(org)}
                                                            className="h-8 w-8 md:w-auto md:px-3 font-bold shadow-none"
                                                            style={{ backgroundColor: lodoLight, color: lodoDark }}
                                                        >
                                                            <Edit className="h-4 w-4 md:mr-2" style={{ color: lodoGreen }} />
                                                            <span className="hidden md:inline text-xs">Editar</span>
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" style={{ color: lodoDark }}>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48 text-xs">
                                                                {org.status === 'DRAFT' && (
                                                                    <DropdownMenuItem onClick={() => handleAction(org.id, submitForReview, 'enviada a revisión')}>
                                                                        <Send className="mr-2 h-4 w-4" style={{ color: lodoGreen }} /> Enviar a Revisión
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {org.status === 'IN_REVIEW' && (
                                                                    <DropdownMenuItem onClick={() => handleAction(org.id, publishOrganization, 'publicada')}>
                                                                        <CheckCircle className="mr-2 h-4 w-4" style={{ color: lodoGreen }} /> Publicar
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {org.status === 'PUBLISHED' && (
                                                                    <DropdownMenuItem onClick={() => handleAction(org.id, archiveOrganization, 'archivada')}>
                                                                        <Archive className="mr-2 h-4 w-4" style={{ color: lodoGreen }} /> Archivar
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {org.status === 'ARCHIVED' && (
                                                                    <DropdownMenuItem onClick={() => handleAction(org.id, submitForReview, 'restaurada a borrador')}>
                                                                        <Send className="mr-2 h-4 w-4" style={{ color: lodoGreen }} /> Restaurar a Borrador
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/public/organizations/${org.id}`, '_blank')}>
                                                                    <ExternalLink className="mr-2 h-4 w-4" /> Ver Datos JSON
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => confirmDelete(org)} className="text-rose-600 font-bold">
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Permanentemente
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2 py-2">
                <span className="text-[11px] font-medium italic" style={{ color: lodoDark }}>
                    Mostrando {Math.min(currentPage * itemsPerPage, sortedOrganizations.length)} de {sortedOrganizations.length}
                </span>
                <div className="flex items-center gap-2 text-xs">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="h-8 px-3"
                        style={{ borderColor: lodoLight, color: lodoDark }}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                    </Button>
                    <span className="font-bold px-2" style={{ color: lodoDark }}>{currentPage} / {totalPages || 1}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="h-8 px-3"
                        style={{ borderColor: lodoLight, color: lodoDark }}
                    >
                        Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                loading={loading}
                title="Eliminar Organización"
                message={`¿Eliminar "${orgToDelete?.name}"?`}
            />
        </div>
    );
}