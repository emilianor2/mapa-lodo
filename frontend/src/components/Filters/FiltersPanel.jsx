import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '../ui/accordion';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../ui/select';
import { Button } from '../ui/button';
import { RotateCcw } from 'lucide-react';
import { useTaxonomies } from '../../context/TaxonomiesContext';
import { cn } from '../../lib/utils';

export default function FiltersPanel({
    filters,
    onFilterChange,
    aggregates,
    loading = false,
    onApply,
    onReset,
    resultsCount
}) {
    const { taxonomies } = useTaxonomies();
    const lodoGreen = "#6FEA44";
    const lodoDark = "#59595B";
    const lodoLight = "#f4f4f5";

    const formatLabel = (label) => {
        if (!label) return '';
        return label.replace(/_/g, ' ');
    };

    const getOptionsWithCounts = (category, aggregateField) => {
        const taxonomyList = taxonomies[category] || [];
        const aggregateList = aggregates && aggregates[aggregateField] ? aggregates[aggregateField] : [];

        if (aggregateList.length > 0) {
            return aggregateList
                .filter(item => item.value && item.value.trim() !== '')
                .map(item => {
                    const taxMatch = taxonomyList.find(t => t.value === item.value || t.id === item.value);
                    return {
                        value: item.value,
                        label: formatLabel(taxMatch?.label || item.value),
                        count: item.count
                    };
                });
        }
        return [];
    };

    const filterConfigs = [
        { key: 'country', label: 'País', agg: 'countries', tax: 'country' },
        { key: 'vertical', label: 'Vertical', agg: 'verticals', tax: 'vertical' },
        { key: 'estadioActual', label: 'Etapa / Madurez', agg: 'estadios', tax: 'estadioActual' },
        { key: 'outcomeStatus', label: 'Estado de Impacto', agg: 'outcomeStatuses', tax: 'outcomeStatus' },
    ];

    if (loading) {
        return (
            <div className="space-y-4 lodo-font">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 animate-pulse rounded-2xl bg-black/5" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 lodo-font">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes border-walking {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                .animated-border-selected {
                    position: relative;
                    border: 1px solid transparent !important;
                    background: linear-gradient(white, white) padding-box,
                                linear-gradient(90deg, #6FEA44 0%, #e5e7eb 50%, #6FEA44 100%) border-box;
                    background-size: 200% auto;
                    animation: border-walking 4s linear infinite;
                    opacity: 0.9;
                }
                .btn-ver-resultados:hover {
                    background-color: #59595B !important;
                    color: #6FEA44 !important;
                }
            `}} />

            <Accordion type="multiple" className="w-full space-y-3" defaultValue={['country', 'vertical']}>
                {filterConfigs.map((config) => {
                    const options = getOptionsWithCounts(config.tax, config.agg);
                    const isSelected = !!filters[config.key];

                    return (
                        <React.Fragment key={config.key}>
                            <AccordionItem
                                value={config.key}
                                className={cn(
                                    "rounded-2xl px-5 transition-all bg-white border",
                                    isSelected ? "animated-border-selected" : "border-black/5"
                                )}
                            >
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#59595B]">
                                            {config.label}
                                        </span>
                                        {isSelected && (
                                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: lodoGreen }} />
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5">
                                    <Select
                                        value={filters[config.key] || "all"}
                                        onValueChange={(val) => onFilterChange(config.key, val === "all" ? "" : val)}
                                    >
                                        <SelectTrigger
                                            className={cn(
                                                "w-full h-11 border transition-all shadow-none rounded-xl font-bold text-[11px] uppercase tracking-wide px-4 focus:ring-0 focus:ring-offset-0",
                                                isSelected ? "border-[#6FEA44]/30" : "border-black/5"
                                            )}
                                            style={{ backgroundColor: lodoLight, color: lodoDark }}
                                        >
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent className="z-[10000] rounded-xl border border-black/5 shadow-xl bg-white p-1">
                                            <SelectItem value="all" className="text-[9px] font-bold uppercase opacity-40">Todos</SelectItem>
                                            {options.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value} className="rounded-lg focus:bg-black/5">
                                                    <div className="flex justify-between items-center w-full gap-8 py-1.5 px-1 font-bold text-[11px] uppercase text-[#59595B]">
                                                        <span>{opt.label}</span>
                                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-black/5 opacity-60">{opt.count}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </AccordionContent>
                            </AccordionItem>

                            {/* PROVINCIA */}
                            {config.key === 'country' && filters.country && (
                                <AccordionItem
                                    value="region"
                                    className={cn(
                                        "rounded-2xl px-5 bg-white animate-in fade-in slide-in-from-top-2 border transition-all",
                                        filters.region ? "animated-border-selected" : "border-transparent"
                                    )}
                                >
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#59595B]">
                                            Provincia
                                            {filters.region && <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: lodoGreen }} />}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-5">
                                        <Select
                                            value={filters.region || "all"}
                                            onValueChange={(val) => onFilterChange('region', val === "all" ? "" : val)}
                                        >
                                            <SelectTrigger className={cn("w-full h-11 border rounded-xl font-bold text-[11px] uppercase px-4", filters.region ? "border-[#6FEA44]/30" : "border-black/5")} style={{ backgroundColor: lodoLight, color: lodoDark }}>
                                                <SelectValue placeholder="Seleccionar provincia..." />
                                            </SelectTrigger>
                                            <SelectContent className="z-[10000] rounded-xl bg-white p-1">
                                                <SelectItem value="all" className="text-[9px] font-bold uppercase opacity-40">Todas</SelectItem>
                                                {getOptionsWithCounts('region', 'regions').map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                                                        <div className="flex justify-between items-center w-full gap-8 text-[11px] uppercase text-[#59595B] font-bold">
                                                            <span>{opt.label}</span>
                                                            <span className="text-[9px] opacity-60">{opt.count}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </AccordionContent>
                                </AccordionItem>
                            )}

                            {/* CIUDAD */}
                            {config.key === 'country' && filters.region && (
                                <AccordionItem
                                    value="city"
                                    className={cn(
                                        "rounded-2xl px-5 bg-white animate-in fade-in slide-in-from-top-2 border transition-all",
                                        filters.city ? "animated-border-selected" : "border-transparent"
                                    )}
                                >
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#59595B]">
                                            Ciudad
                                            {filters.city && <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: lodoGreen }} />}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-5">
                                        <Select
                                            value={filters.city || "all"}
                                            onValueChange={(val) => onFilterChange('city', val === "all" ? "" : val)}
                                        >
                                            <SelectTrigger className={cn("w-full h-11 border rounded-xl font-bold text-[11px] uppercase px-4", filters.city ? "border-[#6FEA44]/30" : "border-black/5")} style={{ backgroundColor: lodoLight, color: lodoDark }}>
                                                <SelectValue placeholder="Seleccionar ciudad..." />
                                            </SelectTrigger>
                                            <SelectContent className="z-[10000] rounded-xl bg-white p-1">
                                                <SelectItem value="all" className="text-[9px] font-bold uppercase opacity-40">Todas</SelectItem>
                                                {getOptionsWithCounts('city', 'cities').map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                                                        <div className="flex justify-between items-center w-full gap-8 text-[11px] uppercase text-[#59595B] font-bold">
                                                            <span>{opt.label}</span>
                                                            <span className="text-[9px] opacity-60">{opt.count}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </AccordionContent>
                                </AccordionItem>
                            )}

                            {/* VERTICAL / SUB VERTICAL */}
                            {config.key === 'vertical' && filters.vertical && (
                                <AccordionItem
                                    value="subVertical"
                                    className={cn(
                                        "rounded-2xl px-5 bg-white animate-in fade-in slide-in-from-top-2 border transition-all",
                                        filters.subVertical ? "animated-border-selected" : "border-transparent"
                                    )}
                                >
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#59595B]">
                                            Sub Vertical
                                            {filters.subVertical && <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: lodoGreen }} />}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-5">
                                        <Select
                                            value={filters.subVertical || "all"}
                                            onValueChange={(val) => onFilterChange('subVertical', val === "all" ? "" : val)}
                                        >
                                            <SelectTrigger className={cn("w-full h-11 border rounded-xl font-bold text-[11px] uppercase px-4", filters.subVertical ? "border-[#6FEA44]/30" : "border-black/5")} style={{ backgroundColor: lodoLight, color: lodoDark }}>
                                                <SelectValue placeholder="Seleccionar sub vertical..." />
                                            </SelectTrigger>
                                            <SelectContent className="z-[10000] rounded-xl bg-white p-1">
                                                <SelectItem value="all" className="text-[9px] font-bold uppercase opacity-40">Todas</SelectItem>
                                                {getOptionsWithCounts('subVertical', 'subVerticals').map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                                                        <div className="flex justify-between items-center w-full gap-8 text-[11px] uppercase text-[#59595B] font-bold">
                                                            <span>{opt.label}</span>
                                                            <span className="text-[9px] opacity-60">{opt.count}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                        </React.Fragment>
                    );
                })}
            </Accordion>

            <div className="mt-auto pt-6 border-t flex flex-col gap-4 border-black/5">
                <Button
                    onClick={onApply}
                    className="btn-ver-resultados w-full h-14 rounded-2xl font-black uppercase tracking-[0.15em] text-[11px] shadow-xl shadow-[#6FEA4415] transition-all active:scale-[0.98]"
                    style={{ backgroundColor: lodoGreen, color: lodoDark }}
                >
                    Ver {resultsCount} Resultados
                </Button>
                <button
                    onClick={onReset}
                    className="w-full py-2 text-[9px] font-black uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-all flex items-center justify-center gap-2"
                    style={{ color: lodoDark }}
                >
                    <RotateCcw size={12} className="text-[#6FEA44]" /> Reiniciar filtros
                </button>
            </div>
        </div>
    );
}