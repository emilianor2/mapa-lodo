import React from 'react';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { MapPin, ArrowRight } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export default function ResultsList({ organizations, onSelect, loading, hideHeader = false }) {

    // Función de formateo consistente para limpiar guiones bajos
    const formatLabel = (label) => {
        if (!label) return '';
        return label.replace(/_/g, ' ');
    };

    if (loading) {
        return (
            <div className="p-8 space-y-8" style={{ backgroundColor: '#f4f4f5' }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-6 w-3/4 rounded-xl" style={{ backgroundColor: '#59595B15' }} />
                        <Skeleton className="h-4 w-1/2 rounded-lg" style={{ backgroundColor: '#59595B10' }} />
                        <div className="flex gap-2">
                            <Skeleton className="h-6 w-24 rounded-full" style={{ backgroundColor: '#6FEA4420' }} />
                            <Skeleton className="h-6 w-24 rounded-full" style={{ backgroundColor: '#59595B10' }} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!organizations || organizations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]" style={{ backgroundColor: '#f4f4f5' }}>
                <div className="p-6 rounded-full mb-6 shadow-sm" style={{ backgroundColor: '#59595B08' }}>
                    <MapPin className="h-10 w-10 opacity-30" style={{ color: '#59595B' }} />
                </div>
                <h3 className="font-black text-xl tracking-tight" style={{ color: '#59595B' }}>Sin resultados</h3>
                <p className="text-xs font-bold mt-3 px-10 leading-relaxed uppercase tracking-wider opacity-60" style={{ color: '#59595B' }}>
                    Prueba a ajustar los filtros o mover el mapa para encontrar lo que buscas.
                </p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col">
                {!hideHeader && (
                    <div className="sticky top-0 z-10 backdrop-blur-md p-6 border-b text-[10px] font-black uppercase tracking-[0.2em]" style={{ backgroundColor: '#f4f4f5cc', borderColor: '#59595B10', color: '#59595B' }}>
                        Lista de Resultados ({organizations.length})
                    </div>
                )}
                {organizations.map((org) => (
                    <div
                        key={org.id}
                        onClick={() => onSelect(org)}
                        className="group relative p-8 border-b last:border-0 cursor-pointer transition-all duration-300 overflow-hidden"
                        style={{ backgroundColor: '#f4f4f5' }}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-black text-lg leading-tight transition-colors pr-10" style={{ color: '#59595B' }}>
                                {org.name}
                            </h3>
                            <ArrowRight className="h-5 w-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 absolute right-8 top-8" style={{ color: '#6FEA44' }} />
                        </div>

                        <div className="flex items-center gap-2 text-[10px] mb-6 font-black uppercase tracking-widest opacity-60" style={{ color: '#59595B' }}>
                            <MapPin className="h-3.5 w-3.5" style={{ color: '#6FEA44' }} />
                            <span>{org.country}{org.city ? ` · ${formatLabel(org.city)}` : ''}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Badge
                                variant="secondary"
                                className="text-[10px] uppercase font-black px-2.5 py-0.5 bg-muted/40 text-muted-foreground border-none tracking-widest"
                            >
                                {formatLabel(org.organizationType)}
                            </Badge>

                            <Badge
                                className="text-[9px] uppercase font-black px-2 h-6 rounded-lg tracking-wider border-none"
                                style={{ backgroundColor: '#6FEA4415', color: '#2DA01D' }}
                            >
                                {formatLabel(org.vertical)}
                            </Badge>

                            {org.estadioActual && (
                                <Badge
                                    className="text-[9px] uppercase font-black px-2 h-6 rounded-lg tracking-wider border-none"
                                    style={{ backgroundColor: '#f4f4f5', color: '#59595B' }}
                                >
                                    {formatLabel(org.estadioActual)}
                                </Badge>
                            )}
                        </div>

                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6FEA44] scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}