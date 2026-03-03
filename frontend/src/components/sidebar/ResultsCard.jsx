import React from 'react';
import ResultsList from '../Results/ResultsList';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LayoutList, Search } from 'lucide-react';
import { Input } from '../ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

export default function ResultsCard({ organizations, onSelect, loading, searchQuery, onSearchChange }) {
    return (
        <Card className="shadow-2xl border-none bg-white rounded-[2.5rem] flex-1 flex flex-col overflow-hidden">
            <CardHeader className="p-8 pb-6 space-y-6 flex-shrink-0">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-[#6FEA4415] rounded-2xl shadow-inner">
                            <LayoutList className="h-5 w-5" style={{ color: '#6FEA44' }} />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black tracking-tighter" style={{ color: '#59595B' }}>Resultados</CardTitle>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-40" style={{ color: '#59595B' }}>
                                {organizations.length} Disponibles
                            </p>
                        </div>
                    </div>

                    <Select defaultValue="newest">
                        <SelectTrigger className="w-[150px] h-10 text-[10px] font-black uppercase tracking-widest border-none bg-[#59595B08] focus:ring-1 focus:ring-[#6FEA44] rounded-xl" style={{ color: '#59595B' }}>
                            <SelectValue placeholder="Ordenar" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                            <SelectItem value="newest" className="rounded-lg text-[10px] font-black uppercase py-3">Recientes</SelectItem>
                            <SelectItem value="az" className="rounded-lg text-[10px] font-black uppercase py-3">A - Z</SelectItem>
                            <SelectItem value="za" className="rounded-lg text-[10px] font-black uppercase py-3">Z - A</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors opacity-40 group-focus-within:opacity-100" style={{ color: '#6FEA44' }} />
                    <Input
                        placeholder="Buscar por nombre..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-11 h-12 bg-[#59595B05] border-transparent focus-visible:ring-1 focus-visible:ring-[#6FEA44] rounded-[1.25rem] transition-all font-bold text-xs"
                        style={{ color: '#59595B' }}
                    />
                </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-hidden">
                <ResultsList
                    organizations={organizations}
                    onSelect={onSelect}
                    loading={loading}
                    hideHeader
                />
            </CardContent>
        </Card>
    );
}
