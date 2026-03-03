import React, { useEffect } from 'react';
import { X, Filter, List, Search, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';
import FiltersPanel from '../Filters/FiltersPanel';
import ResultsList from '../Results/ResultsList';
import ActiveChips from '../Filters/ActiveChips';
import { Input } from '../ui/input';

export default function MapDrawer({
    isOpen, onClose, activeTab, onTabChange, filters, onFilterChange,
    aggregates, onResetFilters, organizations, onSelectOrg,
    loadingResults, loadingFacets, searchQuery, onSearchChange
}) {

    useEffect(() => {
        if (isOpen && window.innerWidth < 1024) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const lodoDark = "#59595B";
    const lodoGreen = "#6FEA44";
    const hasActiveFilters = Object.values(filters).some(v => v !== null && v !== '');

    // Esta función maneja el clic en "Ver Resultados" dentro del panel
    const handleApplyFilters = () => {
        onTabChange('results'); // Cambia a la pestaña de resultados automáticamente
    };

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000] transition-opacity duration-300",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <aside
                className={cn(
                    "fixed z-[2100] shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    "left-1/2 -translate-x-1/2 w-[95vw] md:w-[480px] h-[82vh] rounded-[2.5rem] border lodo-font",
                    isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                )}
                style={{
                    backgroundColor: '#f4f4f5',
                    borderColor: 'rgba(89, 89, 91, 0.1)',
                    top: 'calc(50% + 32px)',
                    transform: 'translate(-50%, -50%)'
                }}
            >
                {/* 1. CABECERA COMPACTA */}
                <div className="flex-shrink-0" style={{ backgroundColor: '#f4f4f5' }}>
                    <div className="flex items-center justify-between p-6 pb-2">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tighter leading-none" style={{ color: lodoDark }}>Explorar</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <p className="text-[9px] font-bold uppercase tracking-widest opacity-50" style={{ color: lodoDark }}>
                                    {activeTab === 'filters' ? 'CONFIGURAR FILTROS' : `${organizations.length} RESULTADOS`}
                                </p>
                                {hasActiveFilters && (
                                    <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: lodoGreen }} />
                                )}
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 hover:bg-black/5" style={{ color: lodoDark }}>
                            <X size={16} />
                        </Button>
                    </div>

                    <div className="px-6 py-3">
                        {/* TAB LIST CON BURBUJA DESLIZANTE */}
                        <div className="relative w-full h-11 p-1 rounded-full border-2 bg-transparent overflow-hidden" style={{ borderColor: lodoDark }}>
                            <div
                                className="absolute inset-y-1 rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                                style={{
                                    backgroundColor: lodoDark,
                                    width: 'calc(50% - 4px)',
                                    left: activeTab === 'filters' ? '4px' : 'calc(50% + 0px)',
                                    zIndex: 0
                                }}
                            />
                            <div className="relative z-10 flex h-full">
                                <button
                                    onClick={() => onTabChange('filters')}
                                    className="flex-1 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-300"
                                    style={{ color: activeTab === 'filters' ? '#fff' : lodoDark }}
                                >
                                    <Filter size={14} /> Filtros
                                </button>
                                <button
                                    onClick={() => onTabChange('results')}
                                    className="flex-1 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-300"
                                    style={{ color: activeTab === 'results' ? '#fff' : lodoDark }}
                                >
                                    <List size={14} /> Resultados
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 min-h-[24px]">
                            <ActiveChips filters={filters} onRemove={onFilterChange} />
                        </div>
                    </div>
                </div>

                {/* 2. CONTENIDO */}
                <div className="flex-1 min-h-0 overflow-hidden relative">
                    {activeTab === 'filters' ? (
                        <ScrollArea className="h-full">
                            <div className="px-6 pb-24 pt-2">
                                <FiltersPanel
                                    filters={filters}
                                    onFilterChange={onFilterChange}
                                    aggregates={aggregates}
                                    loading={loadingFacets}
                                    onApply={handleApplyFilters} // Ahora gatilla el cambio de pestaña
                                    onReset={onResetFilters}     // Conectado correctamente al reset del padre
                                    resultsCount={organizations.length}
                                />
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="h-full flex flex-col">
                            <div className="px-6 pt-2 pb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30" style={{ color: lodoDark }} />
                                    <Input
                                        placeholder="Buscar organización..."
                                        value={searchQuery}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        className="pl-10 h-11 border-none shadow-sm rounded-xl text-xs font-medium bg-white focus-visible:ring-1 focus-visible:ring-[#6FEA44]"
                                    />
                                </div>
                            </div>
                            <ScrollArea className="flex-1 border-t" style={{ backgroundColor: 'rgba(89, 89, 91, 0.02)', borderColor: 'rgba(89, 89, 91, 0.05)' }}>
                                <ResultsList
                                    organizations={organizations}
                                    onSelect={(org) => { onSelectOrg(org); onClose(); }}
                                    loading={loadingResults}
                                    hideHeader
                                />
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}