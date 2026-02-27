import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
    adminCreateOrganization as createOrganization,
    adminUpdateOrganization as updateOrganization,
    fetchTaxonomies
} from '../../services/api';
import { toast } from 'sonner';
import {
    Save, Plus, Edit, Loader2, X, Globe, Linkedin, Instagram, Mail, Phone, Info, LayoutGrid
} from 'lucide-react';

export default function OrgFormMaster({ isOpen, onClose, onCreated, editingOrg }) {
    const initialForm = {
        name: '',
        vertical: '',
        subVertical: '',
        country: '',
        region: '',
        city: '',
        estadioActual: '',
        solucion: '',
        mail: '',
        contactPhone: '',
        website: '',
        logoUrl: '',
        socialMedia: {}, // Backend expects an object (map)
        founders: [],
        founded: '',
        organizationType: '',
        outcomeStatus: 'active',
        notes: '',
        badges: []
    };

    const [form, setForm] = useState(initialForm);
    const [socialMediaList, setSocialMediaList] = useState([]); // Array for UI: [{ network: '', url: '' }]
    const [foundersList, setFoundersList] = useState([]); // Array for UI: ['']
    const [taxonomies, setTaxonomies] = useState({});
    const [loading, setLoading] = useState(false);
    const [newBadge, setNewBadge] = useState('');

    // --- Lógica de mapeo Vertical -> SubVertical ---
    const getSubVerticalsForVertical = (verticalValue, allSubVerticals = []) => {
        if (!verticalValue || verticalValue === 'otra') return [];

        // Definimos el mapeo de asociaciones basados en la base de datos
        const associations = {
            'agtech': ['digital_ag', 'ag_hardware', 'water_tech', 'ag_fintech'],
            'biotech_bioinputs': ['crop_genomics', 'biofertilizers', 'biopesticides', 'sustainable_inputs', 'genetics_breeding', 'bio_protection', 'biostimulants', 'agronomic_support', 'bioengineering'],
            'foodtech': ['novel_ingredients', 'food_processing', 'indoor_ag', 'food_safety'],
            'climatech': ['carbon_solutions', 'soil_health', 'env_impact'],
            'circular_economy': ['waste_upcycling']
        };

        const allowedValues = associations[verticalValue] || [];
        return allSubVerticals.filter(sv => allowedValues.includes(sv.value) || sv.value === 'otra_especificar');
    };

    const handleVerticalChange = (value) => {
        setForm(prev => {
            const updates = { ...prev, vertical: value };
            // Si cambia la vertical, limpiamos la subvertical actual para evitar incongruencias
            updates.subVertical = '';

            // Si es 'otra', nos aseguramos de no enviar subVertical y pedir notas
            if (value === 'otra') {
                updates.subVertical = '';
            }
            return updates;
        });
    };

    // Cargar diccionarios desde el backend al abrir el componente
    useEffect(() => {
        if (isOpen) {
            fetchTaxonomies()
                .then(setTaxonomies)
                .catch(() => toast.error("Error al sincronizar categorías del servidor"));
        }
    }, [isOpen]);

    // Sincronizar datos si estamos editando
    useEffect(() => {
        if (editingOrg && isOpen) {
            setForm({
                ...initialForm,
                ...editingOrg,
                // Aseguramos que los objetos y arrays no sean nulos
                socialMedia: editingOrg.socialMedia || initialForm.socialMedia,
                founders: editingOrg.founders || [],
                badges: editingOrg.badges || [],
                founded: editingOrg.founded || ''
            });

            // Reconstruir array de redes sociales para la UI
            if (editingOrg.socialMedia) {
                const smArray = Object.entries(editingOrg.socialMedia).map(([network, url]) => ({ network, url }));
                setSocialMediaList(smArray);
            } else {
                setSocialMediaList([]);
            }

            // Founders list
            if (editingOrg.founders && editingOrg.founders.length > 0) {
                setFoundersList(editingOrg.founders);
            } else {
                setFoundersList([]);
            }
        } else {
            setForm(initialForm);
            setSocialMediaList([]);
            setFoundersList([]);
        }
    }, [editingOrg, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSelect = (name, value) => {
        if (name === 'vertical') {
            handleVerticalChange(value);
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    // Funciones para Redes Sociales
    const handleAddSocialMedia = () => {
        setSocialMediaList([...socialMediaList, { network: '', url: '' }]);
    };

    const handleUpdateSocialMedia = (index, field, value) => {
        const newList = [...socialMediaList];
        newList[index][field] = value;
        setSocialMediaList(newList);
    };

    const handleRemoveSocialMedia = (index) => {
        setSocialMediaList(socialMediaList.filter((_, i) => i !== index));
    };

    // Funciones para Fundadores
    const handleAddFounder = () => {
        setFoundersList([...foundersList, '']);
    };

    const handleUpdateFounder = (index, value) => {
        const newList = [...foundersList];
        newList[index] = value;
        setFoundersList(newList);
    };

    const handleRemoveFounder = (index) => {
        setFoundersList(foundersList.filter((_, i) => i !== index));
    };

    // Funciones para Insignias (Badges) con Taxonomía o custom
    const handleToggleBadge = (badgeValue) => {
        setForm(prev => {
            let currentBadges = prev.badges || [];

            // Lógica exclusiva para "Ninguna"
            if (badgeValue === 'none') {
                if (currentBadges.includes('none')) {
                    return { ...prev, badges: [] }; // Desmarcar "Ninguna"
                } else {
                    return { ...prev, badges: ['none'] }; // Marcar "Ninguna" borra las demás
                }
            }

            // Si selecciona otra cosa, quitamos "Ninguna"
            currentBadges = currentBadges.filter(b => b !== 'none');

            if (currentBadges.includes(badgeValue)) {
                return { ...prev, badges: currentBadges.filter(b => b !== badgeValue) };
            } else {
                return { ...prev, badges: [...currentBadges, badgeValue] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validar 'notes' si vertical o subvertical es "OTRA"
        if ((form.vertical === 'otra' || form.subVertical === 'otra_especificar') && !form.notes.trim()) {
            toast.error("Por favor, especifica el rubro en Notas Adicionales.");
            setLoading(false);
            return;
        }

        // Convertir array de UI de vuelta al mapa (objeto) esperado por Backend
        const socialMediaMap = {};
        socialMediaList.forEach(item => {
            if (item.network && item.url) {
                socialMediaMap[item.network] = item.url;
            }
        });

        // Filtrar fundadores vacíos
        const cleanFounders = foundersList.filter(f => f.trim() !== '');

        // Preparamos el payload alineado al struct de Go
        const payload = {
            ...form,
            country: form.country?.trim() || null,
            region: form.region?.trim() || null,
            city: form.city?.trim() || null,
            socialMedia: socialMediaMap,
            founders: cleanFounders,
            founded: form.founded ? parseInt(form.founded) : null,
            // Las coordenadas son opcionales porque el back las genera
            lat: form.lat ? parseFloat(form.lat) : null,
            lng: form.lng ? parseFloat(form.lng) : null
        };

        try {
            if (editingOrg) {
                // Para actualización el ID viaja en la URL y el cuerpo
                await updateOrganization(editingOrg.id, payload);
                toast.success("✅ Datos actualizados");
            } else {
                // El ID no se envía para que el Backend genere el UUID automáticamente
                await createOrganization(payload);
                toast.success("🚀 Organización registrada con éxito");
            }
            onCreated(); // Refrescar la tabla o mapa
            onClose();   // Cerrar el drawer/modal
        } catch (err) {
            toast.error(`Error del servidor: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* Aplicamos la paleta oscura #050505 del HomePage al modal */}
            <DialogContent className="sm:max-w-[850px] h-[90vh] p-0 flex flex-col overflow-hidden border-none shadow-2xl bg-background text-slate-900">
                <DialogHeader className="p-8 bg-slate-50 border-b border-slate-200 relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 z-0 pointer-events-none"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-primary/20 text-primary p-3 rounded-2xl border border-primary/20">
                            {editingOrg ? <Edit className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">
                                {editingOrg ? `EDITAR ${form.name}` : 'NUEVA ORGANIZACIÓN'}
                            </DialogTitle>
                            <DialogDescription className="font-medium opacity-60 text-slate-500">
                                {editingOrg ? 'Actualiza los campos del relevamiento.' : 'Registra una nueva entidad (ID y Geo generados automáticamente).'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <form id="org-master-form" onSubmit={handleSubmit} className="p-8 space-y-10">

                        {/* SECCIÓN 1: IDENTIDAD Y DESCRIPCIÓN */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary">
                                    <Info size={16} />
                                    <h3 className="text-xs font-bold uppercase tracking-widest">Identidad</h3>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-slate-500">Nombre de la Organización *</Label>
                                    <Input name="name" value={form.name} onChange={handleChange} required placeholder="Nombre oficial" className="bg-background border-slate-200 text-slate-900 h-11 focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary">
                                    <LayoutGrid size={16} />
                                    <h3 className="text-xs font-bold uppercase tracking-widest">Propuesta de Valor</h3>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-slate-500">Solución / Lo que hacen *</Label>
                                    <textarea name="solucion" value={form.solucion} onChange={handleChange} required className="w-full h-[80px] rounded-xl border border-slate-200 bg-background p-4 text-sm outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-slate-900" placeholder="Describe brevemente el proyecto..." />
                                </div>
                            </div>
                        </section>

                        <Separator className="bg-white/5" />

                        {/* SECCIÓN 2: CATEGORIZACIÓN */}
                        <section className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-slate-500">Vertical *</Label>
                                    <Select value={form.vertical} onValueChange={(v) => handleSelect('vertical', v)}>
                                        <SelectTrigger className="bg-background border-slate-200 text-slate-900 h-11"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent className="bg-background border-slate-200 text-slate-900">
                                            {taxonomies.vertical?.map(t => <SelectItem key={t.id} value={t.value} className="hover:bg-slate-100">{t.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className={`space-y-2 transition-opacity ${form.vertical === 'otra' ? 'opacity-40 pointer-events-none' : ''}`}>
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-slate-500">Sub-Vertical</Label>
                                    <Select value={form.subVertical} onValueChange={(v) => handleSelect('subVertical', v)} disabled={form.vertical === 'otra'}>
                                        <SelectTrigger className="bg-background border-slate-200 text-slate-900 h-11"><SelectValue placeholder="Opcional..." /></SelectTrigger>
                                        <SelectContent className="bg-background border-slate-200 text-slate-900">
                                            {getSubVerticalsForVertical(form.vertical, taxonomies.subvertical).map(t => (
                                                <SelectItem key={t.id} value={t.value} className="hover:bg-slate-100">{t.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-slate-500">Madurez (Stage)</Label>
                                    <Select value={form.estadioActual} onValueChange={(v) => handleSelect('estadioActual', v)}>
                                        <SelectTrigger className="bg-background border-slate-200 text-slate-900 h-11"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent className="bg-background border-slate-200 text-slate-900">
                                            {taxonomies.estadioactual?.map(t => <SelectItem key={t.id} value={t.value} className="hover:bg-slate-100">{t.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-slate-500">Tipo de Org *</Label>
                                    <Select value={form.organizationType} onValueChange={(v) => handleSelect('organizationType', v)}>
                                        <SelectTrigger className="bg-background border-slate-200 text-slate-900 h-11"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent className="bg-background border-slate-200 text-slate-900">
                                            {taxonomies.organizationtype?.map(t => <SelectItem key={t.id} value={t.value} className="hover:bg-slate-100">{t.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {(form.vertical === 'otra' || form.subVertical === 'otra_especificar') && (
                                <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl space-y-2 animate-in fade-in zoom-in-95 duration-300">
                                    <Label className="text-[11px] font-bold uppercase text-primary">Especificar Categoría (Notas) *</Label>
                                    <Input
                                        name="notes"
                                        value={form.notes}
                                        onChange={handleChange}
                                        required
                                        placeholder="Escribe de qué trata el proyecto..."
                                        className="bg-background border-primary/30 text-slate-900"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-slate-500">Estado Salida</Label>
                                    <Select value={form.outcomeStatus} onValueChange={(v) => handleSelect('outcomeStatus', v)}>
                                        <SelectTrigger className="bg-background border-slate-200 text-slate-900 h-11"><SelectValue placeholder="Activa, Adquirida..." /></SelectTrigger>
                                        <SelectContent className="bg-background border-slate-200 text-slate-900">
                                            {/* Fallback si no hay taxonomía outcome_status */}
                                            {taxonomies.outcomestatus?.map(t => <SelectItem key={t.id} value={t.value} className="hover:bg-slate-100">{t.label}</SelectItem>) || (
                                                <>
                                                    <SelectItem value="active" className="hover:bg-slate-100">Activa</SelectItem>
                                                    <SelectItem value="acquired" className="hover:bg-slate-100">Adquirida</SelectItem>
                                                    <SelectItem value="closed" className="hover:bg-slate-100">Cerrada</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-slate-500">Año de Fundación</Label>
                                    <Input type="number" name="founded" value={form.founded} onChange={handleChange} placeholder="Ej. 2018" className="bg-background border-slate-200 text-slate-900 h-11" />
                                </div>
                            </div>
                        </section>

                        <Separator className="bg-white/5" />

                        {/* SECCIÓN 3: INSIGNIAS Y FUNDADORES */}
                        <section className="space-y-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Insignias & Fundadores</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-slate-500">Insignias / Badges</Label>
                                    <div className="flex flex-col gap-3 p-4 bg-background border border-slate-200 rounded-xl">

                                        {/* Opción Manual: Ninguna */}
                                        <div className="flex items-center space-x-2 pb-2 mb-2 border-b border-slate-200">
                                            <input
                                                type="checkbox"
                                                id="badge-none"
                                                checked={(form.badges || []).includes('none')}
                                                onChange={() => handleToggleBadge('none')}
                                                className="h-4 w-4 rounded border-slate-200 bg-white text-primary border focus:ring-primary cursor-pointer accent-primary"
                                            />
                                            <label htmlFor="badge-none" className="text-sm font-medium leading-none cursor-pointer text-slate-500">
                                                Ninguna
                                            </label>
                                        </div>

                                        {taxonomies.badges?.length > 0 ? (
                                            taxonomies.badges.map(t => (
                                                <div key={t.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`badge-${t.id}`}
                                                        checked={(form.badges || []).includes(t.value)}
                                                        onChange={() => handleToggleBadge(t.value)}
                                                        disabled={(form.badges || []).includes('none')}
                                                        className="h-4 w-4 rounded border-slate-200 bg-white text-primary border focus:ring-primary cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                                    />
                                                    <label htmlFor={`badge-${t.id}`} className={`text-sm font-medium leading-none cursor-pointer text-slate-500 ${(form.badges || []).includes('none') ? 'opacity-50' : ''}`}>
                                                        {t.label}
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-xs text-slate-500 italic">No hay insignias en la taxonomía</span>
                                        )}

                                        {/* Input Manual para Otro / Custom */}
                                        <div className="pt-2 mt-2 border-t border-slate-200">
                                            <Label className="text-[10px] uppercase opacity-50 block mb-2 text-slate-500">Agregar Insignia Personalizada</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newBadge}
                                                    onChange={(e) => setNewBadge(e.target.value)}
                                                    placeholder="Ej: Premio local..."
                                                    className="bg-background border-slate-200 text-slate-900 h-9 text-sm"
                                                    disabled={(form.badges || []).includes('none')}
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={(e) => {
                                                        if (newBadge.trim() && !form.badges.includes(newBadge.trim())) {
                                                            setForm(prev => ({ ...prev, badges: [...prev.badges, newBadge.trim()] }));
                                                            setNewBadge('');
                                                        }
                                                    }}
                                                    className="h-9 px-3 bg-primary/20 text-primary hover:bg-primary/30"
                                                    disabled={(form.badges || []).includes('none')}
                                                >
                                                    Añadir
                                                </Button>
                                            </div>

                                            {/* Badges Custom List */}
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {form.badges.filter(b => b !== 'none' && !taxonomies.badges?.some(tb => tb.value === b)).map((b, i) => (
                                                    <Badge key={`custom-${i}`} variant="secondary" className="px-3 py-1.5 flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                                                        {b} <X className="h-3 w-3 cursor-pointer opacity-50 hover:opacity-100" onClick={() => handleToggleBadge(b)} />
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] font-bold uppercase opacity-60 text-slate-500">Fundadores / Equipo</Label>
                                        <Button type="button" variant="link" size="sm" onClick={handleAddFounder} className="h-auto p-0 text-primary hover:text-primary/80">
                                            + Agregar Creador
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {foundersList.map((founder, index) => (
                                            <div key={index} className="flex gap-2 relative">
                                                <Input
                                                    value={founder}
                                                    onChange={(e) => handleUpdateFounder(index, e.target.value)}
                                                    placeholder="Nombre Completo"
                                                    className="flex-1 bg-background border-slate-200 text-slate-900 h-11 pr-10 focus:border-primary/50"
                                                />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFounder(index)} className="absolute right-0 top-0 h-11 w-11 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {foundersList.length === 0 && (
                                            <div className="text-sm text-slate-500 italic bg-background p-4 border border-dashed border-slate-200 rounded-xl text-center">
                                                Sin fundadores agregados.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <Separator className="bg-white/5" />

                        {/* SECCIÓN 4: UBICACIÓN (ID y Geo son automáticos) */}
                        <section className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Geografía</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Input name="country" value={form.country} onChange={handleChange} placeholder="País" className="bg-background border-slate-200 text-slate-900 h-11 focus:border-primary/50" />
                                <Input name="region" value={form.region} onChange={handleChange} placeholder="Provincia" className="bg-background border-slate-200 text-slate-900 h-11 focus:border-primary/50" />
                                <Input name="city" value={form.city} onChange={handleChange} placeholder="Ciudad" className="bg-background border-slate-200 text-slate-900 h-11 focus:border-primary/50" />
                            </div>
                        </section>

                        <Separator className="bg-white/5" />

                        {/* SECCIÓN 5: CONTACTO Y REDES */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label className="text-[11px] font-bold uppercase opacity-60 text-slate-500">Canales Directos</Label>
                                <div className="space-y-3">
                                    <div className="relative"><Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input name="website" value={form.website} onChange={handleChange} placeholder="Sitio Web" className="pl-10 h-11 bg-background border-slate-200 text-slate-900 focus:border-primary/50" /></div>
                                    <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input name="mail" value={form.mail} onChange={handleChange} placeholder="Email de contacto" className="pl-10 h-11 bg-background border-slate-200 text-slate-900 focus:border-primary/50" /></div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-slate-500">Redes Sociales Dinámicas</Label>
                                    <Button type="button" variant="link" size="sm" onClick={handleAddSocialMedia} className="h-auto p-0 text-primary hover:text-primary/80">
                                        + Agregar Red
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {socialMediaList.map((item, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Select value={item.network} onValueChange={(val) => handleUpdateSocialMedia(index, 'network', val)}>
                                                <SelectTrigger className="w-[130px] bg-background border-slate-200 text-slate-900 h-11 focus:border-primary/50">
                                                    <SelectValue placeholder="Red" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-background border-slate-200 text-slate-900">
                                                    <SelectItem value="linkedin" className="hover:bg-slate-100">LinkedIn</SelectItem>
                                                    <SelectItem value="instagram" className="hover:bg-slate-100">Instagram</SelectItem>
                                                    <SelectItem value="x" className="hover:bg-slate-100">X (Twitter)</SelectItem>
                                                    <SelectItem value="facebook" className="hover:bg-slate-100">Facebook</SelectItem>
                                                    <SelectItem value="youtube" className="hover:bg-slate-100">YouTube</SelectItem>
                                                    <SelectItem value="tiktok" className="hover:bg-slate-100">TikTok</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                value={item.url}
                                                onChange={(e) => handleUpdateSocialMedia(index, 'url', e.target.value)}
                                                placeholder="URL del perfil"
                                                className="flex-1 bg-background border-slate-200 text-slate-900 h-11 focus:border-primary/50"
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSocialMedia(index)} className="h-11 w-11 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 shrink-0">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {socialMediaList.length === 0 && (
                                        <div className="text-sm text-slate-500 italic bg-background p-4 border border-dashed border-slate-200 rounded-xl text-center">
                                            Sin redes agregadas. Haz clic en '+ Agregar Red'.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                    </form>
                </ScrollArea>

                <DialogFooter className="p-8 border-t border-slate-200 bg-slate-100">
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100">Cancelar</Button>
                    <Button form="org-master-form" type="submit" disabled={loading} className="px-10 h-12 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-[#58595b]">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                        {editingOrg ? 'Guardar Cambios' : 'Registrar Startup'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}