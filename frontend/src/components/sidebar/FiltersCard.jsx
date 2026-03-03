import React from 'react';
import FiltersPanel from '../Filters/FiltersPanel';
import ActiveChips from '../Filters/ActiveChips';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { RotateCcw, Filter } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

export default function FiltersCard({ filters, onFilterChange, aggregates, onReset }) {
    return (
        <Card className="shadow-2xl border-none bg-white rounded-[2.5rem] flex-shrink-0 w-full md:w-[350px] flex flex-col overflow-hidden">
            <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-[#6FEA4415] rounded-2xl shadow-inner">
                        <Filter className="h-5 w-5" style={{ color: '#6FEA44' }} />
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tighter" style={{ color: '#59595B' }}>Filtros</CardTitle>
                </div>
            </CardHeader>

            <ScrollArea className="flex-1">
                <CardContent className="p-6 pt-2">
                    <div className="mb-6">
                        <ActiveChips
                            filters={filters}
                            onRemove={onFilterChange}
                        />
                    </div>

                    <FiltersPanel
                        filters={filters}
                        onFilterChange={onFilterChange}
                        aggregates={aggregates}
                        onReset={onReset}
                        compact
                    />

                    <div className="mt-10 pt-8 border-t" style={{ borderColor: '#59595B08' }}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onReset}
                            className="w-full h-12 hover:bg-[#59595B05] gap-3 transition-all rounded-2xl font-black uppercase text-[10px] tracking-[0.2em]"
                            style={{ color: '#59595B60' }}
                        >
                            <RotateCcw className="h-4 w-4" style={{ color: '#6FEA44' }} />
                            <span>Reiniciar</span>
                        </Button>
                    </div>
                </CardContent>
            </ScrollArea>
        </Card>
    );
}
