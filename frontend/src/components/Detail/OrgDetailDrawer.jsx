import React, { useState, useEffect } from 'react';
import {
    X, ExternalLink, MapPin, Globe, Linkedin, Mail, Phone,
    Instagram, Tag, Info, Layers, Award
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { fetchOrganizationById } from '../../services/api';

export default function OrgDetailDrawer({ orgId, onClose }) {
    // Colores de marca LODO
    const lodoGreen = "#6FEA44";
    const lodoDark = "#59595B";
    const lodoLight = "#f4f4f5";

    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!orgId) return;
        setLoading(true);
        setError(null);
        fetchOrganizationById(orgId)
            .then(data => {
                setOrg(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [orgId]);

    return (
        <Dialog open={!!orgId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent hideClose className="sm:max-w-[700px] h-[90vh] md:h-[85vh] p-0 overflow-hidden flex flex-col gap-0 border-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-[3rem]" style={{ backgroundColor: '#fff' }}>
                {loading ? (
                    <div className="p-8 space-y-6">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                        <div className="flex gap-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-20" />
                        </div>
                        <Skeleton className="h-40 w-full" />
                    </div>
                ) : error ? (
                    <div className="p-12 text-center">
                        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
                            Error al cargar detalles: {error}
                        </div>
                        <Button onClick={onClose} style={{ backgroundColor: lodoGreen, color: '#000' }}>Cerrar</Button>
                    </div>
                ) : org ? (
                    <>
                        <div
                            className="h-40 relative overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${lodoGreen}20, ${lodoGreen}05, transparent)` }}
                        >
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#59595B 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="absolute right-6 top-6 bg-white/40 backdrop-blur-md hover:bg-white transition-all rounded-2xl shadow-sm z-50 h-10 w-10"
                            >
                                <X className="h-5 w-5" style={{ color: lodoDark }} />
                            </Button>
                        </div>

                        <div className="px-10 -mt-12 relative z-10 flex flex-col flex-1 min-h-0 bg-white rounded-t-[3rem]">
                            <div className="bg-white p-6 rounded-[2rem] shadow-2xl border-4 border-white mb-6 inline-flex self-start -mt-10">
                                {org.logoUrl ? (
                                    <img src={org.logoUrl} alt={org.name} className="h-16 w-16 object-contain" />
                                ) : (
                                    <Globe className="h-16 w-16" style={{ color: lodoGreen }} />
                                )}
                            </div>

                            <DialogHeader className="mb-8">
                                <div className="flex items-center gap-3 mb-3">
                                    <Badge variant="outline" className="text-[10px] uppercase font-black tracking-[0.2em] px-3 h-6 rounded-lg" style={{ color: lodoDark, borderColor: '#59595B20' }}>{org.organizationType}</Badge>
                                    <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-[0.2em] px-3 h-6 rounded-lg border-none" style={{ backgroundColor: `${lodoGreen}15`, color: '#2DA01D' }}>
                                        {org.vertical}
                                    </Badge>
                                </div>
                                <DialogTitle className="text-4xl font-black tracking-tighter mb-2" style={{ color: lodoDark }}>
                                    {org.name}
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-60" style={{ color: lodoDark }}>
                                    <MapPin className="h-3.5 w-3.5" style={{ color: lodoGreen }} />
                                    {org.city}, {org.country}
                                </DialogDescription>
                            </DialogHeader>

                            <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                                <TabsList className="w-full justify-start bg-transparent border-b rounded-none px-0 mb-8 gap-10 h-auto pb-0" style={{ borderColor: '#59595B08' }}>
                                    <TabsTrigger
                                        value="overview"
                                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-4 rounded-none px-0 pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all opacity-40 data-[state=active]:opacity-100"
                                        style={{ '--tw-state-active-border-color': lodoGreen, color: lodoDark }}
                                    >Resumen</TabsTrigger>
                                    <TabsTrigger
                                        value="location"
                                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-4 rounded-none px-0 pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all opacity-40 data-[state=active]:opacity-100"
                                        style={{ '--tw-state-active-border-color': lodoGreen, color: lodoDark }}
                                    >Ubicación</TabsTrigger>
                                    <TabsTrigger
                                        value="links"
                                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-4 rounded-none px-0 pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all opacity-40 data-[state=active]:opacity-100"
                                        style={{ '--tw-state-active-border-color': lodoGreen, color: lodoDark }}
                                    >Contacto</TabsTrigger>
                                </TabsList>

                                <ScrollArea className="flex-1 px-1">
                                    <TabsContent value="overview" className="mt-0 space-y-8 pb-8">
                                        <section className="bg-[#f4f4f5] p-8 rounded-[2rem] border border-[#59595B05]">
                                            <div className="flex items-center gap-3 mb-6" style={{ color: lodoDark }}>
                                                <div className="h-6 w-1 bg-[#6FEA44] rounded-full" />
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.25em]">Sobre la Solución</h4>
                                            </div>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap font-bold opacity-70" style={{ color: lodoDark }}>
                                                {org.solucion || 'Sin descripción disponible.'}
                                            </p>
                                        </section>

                                        <Separator style={{ backgroundColor: `${lodoDark}10` }} />

                                        <div className="grid grid-cols-2 gap-8">
                                            <section>
                                                <div className="flex items-center gap-2 mb-4" style={{ color: lodoDark }}>
                                                    <Layers className="h-4 w-4" style={{ color: lodoGreen }} />
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Estado</h4>
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="bg-white p-5 rounded-2xl border border-[#59595B05] shadow-sm">
                                                        <p className="text-[9px] font-black uppercase mb-1 opacity-40" style={{ color: lodoDark }}>Etapa Actual</p>
                                                        <p className="text-sm font-black tracking-tight" style={{ color: lodoDark }}>{org.estadioActual || org.estadio_actual || '-'}</p>
                                                    </div>
                                                    <div className="bg-white p-5 rounded-2xl border border-[#59595B05] shadow-sm">
                                                        <p className="text-[9px] font-black uppercase mb-1 opacity-40" style={{ color: lodoDark }}>Estado Operativo</p>
                                                        <p className="text-sm font-black tracking-tight capitalize" style={{ color: lodoDark }}>{org.outcomeStatus || org.outcome_status || '-'}</p>
                                                    </div>
                                                </div>
                                            </section>

                                            <section>
                                                <div className="flex items-center gap-2 mb-4" style={{ color: lodoDark }}>
                                                    <Tag className="h-4 w-4" style={{ color: lodoGreen }} />
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Atributos</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {(org.badges || org.badges || []).map((badge, i) => (
                                                        <Badge key={i} variant="secondary" className="text-[9px] font-black uppercase tracking-widest h-7 px-3 rounded-lg border-none" style={{ backgroundColor: '#f4f4f5', color: lodoDark }}>{badge}</Badge>
                                                    ))}
                                                    {org.founders?.length > 0 && (
                                                        <div className="w-full mt-6 bg-white p-5 rounded-2xl border border-[#59595B05] shadow-sm">
                                                            <p className="text-[9px] font-black uppercase mb-1 opacity-40" style={{ color: lodoDark }}>Fundadores</p>
                                                            <p className="text-sm font-black tracking-tight leading-relaxed" style={{ color: lodoDark }}>{org.founders.join(', ')}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="location" className="mt-0 space-y-6 pb-8">
                                        <div className="rounded-[2rem] border bg-white p-10 space-y-6 shadow-xl" style={{ borderColor: '#59595B08' }}>
                                            <div className="flex items-start gap-5">
                                                <div className="p-4 rounded-2xl shadow-inner" style={{ backgroundColor: `${lodoGreen}10` }}>
                                                    <MapPin className="h-7 w-7" style={{ color: lodoGreen }} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-3xl tracking-tighter" style={{ color: lodoDark }}>{org.city || 'Ubicación'}</h4>
                                                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mt-1" style={{ color: lodoDark }}>{org.region ? `${org.region}, ` : ''}{org.country}</p>
                                                </div>
                                            </div>
                                            {org.lat && org.lng && (
                                                <div className="text-[10px] font-black tracking-widest p-4 rounded-xl bg-[#f4f4f5] border border-[#59595B05]" style={{ color: lodoDark }}>
                                                    GPS <span className="mx-2 opacity-20">|</span> {org.lat.toFixed(6)} , {org.lng.toFixed(6)}
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="links" className="mt-0 space-y-4 pb-8">
                                        {org.website && (
                                            <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 rounded-[1.5rem] border bg-white hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 group shadow-sm" style={{ borderColor: '#59595B05' }}>
                                                <div className="flex items-center gap-5">
                                                    <div className="p-3 rounded-xl bg-[#6FEA4410]">
                                                        <Globe className="h-6 w-6" style={{ color: lodoGreen }} />
                                                    </div>
                                                    <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: lodoDark }}>Sitio Web Oficial</p>
                                                </div>
                                                <ExternalLink className="h-5 w-5 opacity-20 group-hover:opacity-100 transition-opacity" style={{ color: lodoDark }} />
                                            </a>
                                        )}

                                        {org.socialMedia?.linkedin && (
                                            <a href={org.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 rounded-[1.5rem] border bg-white hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 group shadow-sm" style={{ borderColor: '#59595B05' }}>
                                                <div className="flex items-center gap-5">
                                                    <div className="p-3 rounded-xl bg-[#0077b510]">
                                                        <Linkedin className="h-6 w-6 text-[#0077b5]" />
                                                    </div>
                                                    <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: lodoDark }}>Perfil de LinkedIn</p>
                                                </div>
                                                <ExternalLink className="h-5 w-5 opacity-20 group-hover:opacity-100 transition-opacity" style={{ color: lodoDark }} />
                                            </a>
                                        )}

                                        {org.mail && (
                                            <div className="flex items-center gap-5 p-6 rounded-[1.5rem] border bg-[#f4f4f5]/50 shadow-sm" style={{ borderColor: '#59595B05' }}>
                                                <div className="p-3 rounded-xl bg-[#59595B10]">
                                                    <Mail className="h-6 w-6 opacity-40" style={{ color: lodoDark }} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1" style={{ color: lodoDark }}>Correo Electrónico</p>
                                                    <p className="text-sm font-black tracking-tight" style={{ color: lodoDark }}>{org.mail}</p>
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>
                                </ScrollArea>
                            </Tabs>
                        </div>
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}