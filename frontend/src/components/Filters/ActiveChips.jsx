import React from 'react';
import { X, Trash2 } from 'lucide-react';

export default function ActiveChips({ filters, onRemove }) {
    const activeFilters = Object.entries(filters).filter(([key, value]) => {
        if (key === 'q' || key === 'onlyMappable') return false;
        return value !== '' && value !== null && value !== undefined;
    });

    if (activeFilters.length === 0) return null;

    const formatLabel = (label) => {
        if (!label) return '';
        return label.replace(/_/g, ' ');
    };

    const labelMap = {
        country: 'Pais',
        region: 'Provincia',
        city: 'Ciudad',
        vertical: 'Vertical',
        subVertical: 'Sub Vertical',
        organizationType: 'Tipo',
        estadioActual: 'Etapa',
        outcomeStatus: 'Estado'
    };

    const handleClearAll = () => {
        activeFilters.forEach(([key]) => {
            onRemove(key, '');
        });
    };

    return (
        <div className="flex flex-wrap items-center gap-2 pt-2">
            {activeFilters.map(([key, value]) => (
                <div
                    key={key}
                    className="flex items-center gap-3 pl-4 pr-2 py-2 border-[1.5px] border-[#6FEA44]/40 bg-white rounded-2xl shadow-sm transition-all hover:shadow-md animate-in zoom-in-95 duration-200"
                >
                    <div className="flex flex-col -space-y-0.5">
                        <span className="text-[7px] uppercase font-black opacity-30 tracking-widest">
                            {labelMap[key] || key}
                        </span>
                        <span className="font-bold text-[10px] uppercase tracking-tight text-[#59595B]">
                            {formatLabel(value)}
                        </span>
                    </div>

                    <div
                        className="h-1.5 w-1.5 rounded-full animate-pulse duration-[2500ms] bg-[#6FEA44]"
                        style={{
                            animationName: 'pulse-color',
                            animationIterationCount: 'infinite'
                        }}
                    />

                    <style
                        dangerouslySetInnerHTML={{
                            __html: `
                        @keyframes pulse-color {
                            0% { background-color: #e5e7eb; }
                            50% { background-color: #6FEA44; }
                            100% { background-color: #e5e7eb; }
                        }
                    `
                        }}
                    />

                    <button
                        onClick={() => onRemove(key, '')}
                        className="ml-1 rounded-xl p-1.5 transition-all hover:bg-red-50 hover:text-red-500 group active:scale-90"
                    >
                        <X className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-colors" />
                    </button>
                </div>
            ))}

            {activeFilters.length > 1 && (
                <button
                    onClick={handleClearAll}
                    className="group flex items-center gap-1.5 px-3 py-2 text-[9px] uppercase font-bold tracking-wider text-black/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                    <Trash2 className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-colors" />
                    Limpiar filtros
                </button>
            )}
        </div>
    );
}
