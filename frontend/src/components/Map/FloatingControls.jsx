import React from 'react';
import { Button } from '../ui/button';
import { Filter, List, Map as MapIcon, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function FloatingControls({
    onOpenFilters,
    onOpenList,
    resultsCount,
    loading
}) {
    return (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[900] flex items-center gap-3 w-max max-w-[90vw]">
            {/* Search/Filter Pill Container */}
            <div className="flex items-center backdrop-blur-xl border shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl p-1.5 transition-all hover:shadow-[0_8px_40px_rgba(111,234,68,0.2)]" style={{ backgroundColor: '#f4f4f5cc', borderColor: '#59595B20' }}>

                {/* Filters Button */}
                <Button
                    variant="ghost"
                    onClick={onOpenFilters}
                    className="h-10 px-4 rounded-xl flex items-center gap-2 transition-all duration-300 font-black text-xs uppercase tracking-widest"
                    style={{ color: '#59595B' }}
                >
                    <Filter className="h-4 w-4" style={{ color: '#6FEA44' }} />
                    <span>Filtros</span>
                </Button>

                <div className="w-[1px] h-6 mx-1" style={{ backgroundColor: '#59595B20' }} />

                {/* Results Button */}
                <Button
                    variant="ghost"
                    onClick={onOpenList}
                    className="h-10 px-4 rounded-xl flex items-center gap-2 transition-all duration-300 font-black text-xs uppercase tracking-widest"
                    style={{ color: '#59595B' }}
                >
                    <List className="h-4 w-4 flex-shrink-0" style={{ color: '#6FEA44' }} />
                    <span>Mapa de Resultados</span>
                    <span className="ml-1 shrink-0 min-w-[28px] px-2 py-0.5 rounded-full text-[10px] inline-flex items-center justify-center font-black tabular-nums transition-all shadow-sm" style={{ backgroundColor: '#6FEA44', color: '#000' }}>
                        {resultsCount}
                    </span>
                </Button>
            </div>

            {/* (Agregar Empresa moved to header) */}

            {/* Loading Indicator - Absolute to prevent shifting the center pill */}
            <div className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 pointer-events-none w-max">
                {loading && (
                    <div className="flex items-center gap-2 backdrop-blur-md border px-4 py-2 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-500" style={{ backgroundColor: '#f4f4f5ee', borderColor: '#6FEA4440' }}>
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#6FEA44' }} />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: '#59595B' }}>Buscando Startups...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
