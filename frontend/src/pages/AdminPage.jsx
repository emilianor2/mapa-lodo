import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import AdminTable from '../components/admin/AdminTable';
import OrgFormMaster from '../components/admin/OrgFormMaster';
import { adminFetchOrganizations as listOrganizations } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Plus, Search,
    Database, RefreshCcw, Download,
    AlertCircle, ShieldX
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';

export default function AdminPage() {
    const { isAuthenticated, isAdmin, loading: authLoading, user } = useAuth();
    const navigate = useNavigate();
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);

    // Colores de marca LODO
    const lodoGreen = "#6FEA44";
    const lodoDark = "#59595B";

    // Función de taxonomía para etiquetas y estados
    const formatStatusLabel = (status) => {
        const translations = {
            'TOTAL': 'Total',
            'DRAFT': 'Borradores',
            'IN_REVIEW': 'En Revisión',
            'PUBLISHED': 'Publicados',
            'ARCHIVED': 'Archivados'
        };
        return translations[status] || status.replace(/_/g, ' ');
    };

    const refreshData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await listOrganizations();
            setOrganizations(data || []);
            setError(null);
        } catch (err) {
            setError("Error al cargar datos. Verifica la conexión y el token.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const filteredOrgs = useMemo(() => {
        return organizations.filter(org => {
            const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                org.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || org.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [organizations, searchTerm, statusFilter]);

    const counts = useMemo(() => {
        return {
            TOTAL: organizations.length,
            DRAFT: organizations.filter(o => o.status === 'DRAFT').length,
            IN_REVIEW: organizations.filter(o => o.status === 'IN_REVIEW').length,
            PUBLISHED: organizations.filter(o => o.status === 'PUBLISHED').length,
            ARCHIVED: organizations.filter(o => o.status === 'ARCHIVED').length,
        };
    }, [organizations]);

    const handleEdit = (org) => {
        setSelectedOrg(org);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setSelectedOrg(null);
        setIsFormOpen(true);
    };

    if (authLoading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#f4f4f5' }}>
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: lodoGreen }}></div>
                        <p style={{ color: lodoDark }}>Verificando acceso...</p>
                    </div>
                </div>
            </AppShell>
        );
    }

    if (!isAdmin) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#f4f4f5' }}>
                    <div className="text-center max-w-md p-10 bg-white rounded-[2.5rem] shadow-xl border" style={{ borderColor: '#59595B10' }}>
                        <div className="p-5 rounded-full w-fit mx-auto mb-8" style={{ backgroundColor: '#59595B08' }}>
                            <ShieldX className="h-12 w-12" style={{ color: lodoDark }} />
                        </div>
                        <h2 className="text-3xl font-black mb-4 tracking-tighter" style={{ color: lodoDark }}>Acceso Denegado</h2>
                        <p className="text-sm font-bold mb-8 uppercase tracking-widest leading-relaxed opacity-60" style={{ color: lodoDark }}>
                            No tienes permisos de administrador para acceder a esta sección.
                            <br />
                            <span className="text-[10px]">Conectado como: {user?.email}</span>
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button variant="ghost" onClick={() => navigate('/')} className="font-black uppercase text-[10px] tracking-widest px-6" style={{ color: lodoDark }}>
                                Inicio
                            </Button>
                            <Button onClick={() => navigate('/map')} className="font-black uppercase text-[10px] tracking-widest px-8 rounded-xl shadow-lg" style={{ backgroundColor: lodoGreen, color: lodoDark, boxShadow: `0 8px 20px ${lodoGreen}40` }}>
                                Ver Mapa
                            </Button>
                        </div>
                    </div>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes border-walking {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                @keyframes pulse-dot {
                    0% { transform: scale(0.9); opacity: 0.5; background-color: #e5e7eb; }
                    50% { transform: scale(1.1); opacity: 1; background-color: #6FEA44; }
                    100% { transform: scale(0.9); opacity: 0.5; background-color: #e5e7eb; }
                }
                .lodo-animated-border {
                    position: relative;
                    border: 1px solid transparent !important;
                    background: linear-gradient(white, white) padding-box,
                                linear-gradient(90deg, #6FEA44 0%, #e5e7eb 50%, #6FEA44 100%) border-box;
                    background-size: 200% auto;
                    animation: border-walking 4s linear infinite;
                }
                .active-pulse-dot {
                    animation: pulse-dot 2s infinite ease-in-out;
                }
            `}} />

            <div className="flex flex-col min-h-full" style={{ backgroundColor: '#f4f4f5' }}>
                <div className="border-b px-10 py-8 shadow-sm" style={{ backgroundColor: '#f4f4f5', borderColor: '#59595B10' }}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] mb-3 opacity-60" style={{ color: lodoDark }}>
                                <LayoutDashboard className="h-3.5 w-3.5" style={{ color: lodoGreen }} />
                                Panel de Administración
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter flex items-center gap-4" style={{ color: lodoDark }}>
                                <Database className="h-8 w-8 opacity-20" />
                                Organizaciones
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/admin/import')}
                                className="lodo-animated-border font-black uppercase text-[10px] tracking-widest px-5 h-11 transition-all rounded-xl"
                                style={{ color: lodoDark }}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Gestionar Excel
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => refreshData()}
                                disabled={loading}
                                className="lodo-animated-border font-black uppercase text-[10px] tracking-widest px-5 h-11 transition-all rounded-xl"
                                style={{ color: lodoDark }}
                            >
                                <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Actualizar
                            </Button>
                            <Button
                                onClick={handleCreate}
                                className="font-black uppercase text-[10px] tracking-widest shadow-xl rounded-xl px-8 h-12 transition-all duration-300 border-2"
                                style={{
                                    backgroundColor: lodoGreen,
                                    color: lodoDark,
                                    borderColor: lodoGreen,
                                    boxShadow: '0 10px 30px #6FEA4430'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = lodoGreen;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = lodoGreen;
                                    e.currentTarget.style.color = lodoDark;
                                }}
                            >
                                <Plus className="h-5 w-5 mr-3" />
                                Nueva Organización
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        {Object.entries(counts).map(([status, count]) => (
                            <div
                                key={status}
                                onClick={() => setStatusFilter(status === 'TOTAL' ? 'ALL' : status)}
                                className={`
                                    p-4 rounded-2xl border transition-all cursor-pointer group
                                    ${(status === 'TOTAL' ? statusFilter === 'ALL' : statusFilter === status)
                                        ? 'bg-white border-[#6FEA44] shadow-sm ring-1 ring-[#6FEA44]'
                                        : 'bg-[#59595B03] hover:bg-white border-[#59595B10]'}
                                `}
                            >
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-[#6FEA44] transition-colors">
                                    {formatStatusLabel(status)}
                                </p>
                                <p className="text-2xl font-black" style={{ color: lodoDark }}>{count}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#6FEA44] transition-colors" />
                            <Input
                                placeholder="Buscar por nombre o ID..."
                                className="pl-10 h-11 bg-white border-none shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-[#6FEA44]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex lodo-animated-border p-1 rounded-xl">
                            {['ALL', 'DRAFT', 'PUBLISHED'].map((filter) => (
                                <Button
                                    key={filter}
                                    variant={statusFilter === filter ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setStatusFilter(filter)}
                                    className={`rounded-lg h-9 px-4 text-xs font-bold ${statusFilter === filter ? 'bg-white shadow-sm' : ''}`}
                                    style={{ color: lodoDark }}
                                >
                                    {filter === 'ALL' ? 'Todos' : filter === 'DRAFT' ? 'Borradores' : 'Publicados'}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-8 pt-6">
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full rounded-xl" />
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-dashed border-rose-200 p-8 text-center shadow-sm">
                            <div className="bg-rose-50 p-4 rounded-full mb-4">
                                <AlertCircle className="h-8 w-8 text-rose-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{error}</h3>
                            <Button variant="outline" onClick={() => refreshData()} className="mt-2">Reintentar</Button>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <AdminTable
                                organizations={filteredOrgs}
                                onRefresh={() => refreshData(true)}
                                onSelect={handleEdit}
                            />

                            {filteredOrgs.length === 0 && (
                                <div className="py-20 text-center flex flex-col items-center">
                                    <div className="bg-white p-6 rounded-full mb-4 shadow-sm">
                                        <Search className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 font-medium">No se encontraron resultados para los filtros aplicados.</p>
                                    <Button variant="link" onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }} style={{ color: lodoGreen }}>Limpiar filtros</Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <OrgFormMaster
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onCreated={() => refreshData(true)}
                editingOrg={selectedOrg}
            />
        </AppShell>
    );
}
