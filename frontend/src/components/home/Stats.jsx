import React, { useEffect, useState, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { Search, Filter, Layers, Pin, Globe } from 'lucide-react';
import { fetchAggregates } from '../../services/api';

const AnimatedCounter = React.memo(({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (isInView && value > 0) {
            let startTimestamp = null;
            const end = parseInt(value);
            const duration = 2000;

            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                setDisplayValue(Math.floor(progress * end));
                if (progress < 1) window.requestAnimationFrame(step);
            };
            window.requestAnimationFrame(step);
        }
    }, [isInView, value]);

    return <span ref={ref}>{displayValue}</span>;
});

const Stats = () => {
    const [stats, setStats] = useState({ organizations: 0, countries: 0, sectors: 0, types: 0 });
    const [loading, setLoading] = useState(true);

    // Colores de marca
    const lodoGreen = "#6FE844";
    const lodoDark = "#59595B";

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await fetchAggregates();
                setStats({
                    organizations: data.organizationTypes.reduce((acc, curr) => acc + curr.count, 0),
                    countries: data.countries.filter(c => c.value && c.value !== '').length,
                    sectors: data.sectorsPrimary.length,
                    types: data.organizationTypes.length
                });
            } catch (error) {
                console.error("Error loading stats:", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const statsConfig = useMemo(() => [
        { label: 'Organizaciones', value: stats.organizations, icon: Layers },
        { label: 'Países', value: stats.countries, icon: Globe },
        { label: 'Sectores', value: stats.sectors, icon: Pin },
        { label: 'Tipos', value: stats.types, icon: Search },
    ], [stats]);

    return (
        <section className="py-24 bg-zinc-100 transition-colors duration-500 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col lg:flex-row gap-16 items-center">
                    
                    {/* Visual de Mapa con Interactividad de Movimiento */}
                    <div className="flex-1 relative order-2 lg:order-1 w-full group/map">
                        <motion.div
                            initial={{ opacity: 0, rotateY: -10 }}
                            whileInView={{ opacity: 1, rotateY: 0 }}
                            whileHover={{ perspective: 1000, rotateX: 2, rotateY: -2 }}
                            viewport={{ once: true }}
                            className="relative rounded-[2.5rem] overflow-hidden border border-zinc-200 bg-white aspect-video shadow-2xl transition-transform duration-500 ease-out"
                        >
                            {/* Escáner visual que recorre el mapa */}
                            <motion.div 
                                animate={{ top: ["-100%", "200%"] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 w-full h-20 bg-gradient-to-b from-transparent via-[#6FE844]/20 to-transparent z-10 pointer-events-none"
                            />

                            <div className="absolute top-6 left-6 z-20 flex gap-2">
                                <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl border border-zinc-200 flex items-center text-xs text-zinc-500 shadow-sm">
                                    <Search className="w-3 h-3 mr-2 text-[#6FE844]" />
                                    Mapeando ecosistema...
                                </div>
                            </div>

                            {/* Grilla del Mapa */}
                            <div className="absolute inset-0 bg-zinc-50 grid grid-cols-12 grid-rows-12 opacity-40">
                                {Array.from({ length: 144 }).map((_, i) => (
                                    <div key={i} className="border-[0.5px] border-zinc-200" />
                                ))}
                            </div>

                            {/* Puntos interactivos con pulso */}
                            {[
                                { t: '20%', l: '30%' }, { t: '45%', l: '60%' },
                                { t: '70%', l: '25%' }, { t: '40%', l: '15%' },
                                { t: '55%', l: '80%' }
                            ].map((p, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                                    style={{ top: p.t, left: p.l, backgroundColor: lodoGreen }}
                                    className="absolute w-3 h-3 rounded-full z-10 shadow-[0_0_15px_rgba(111,232,68,0.6)]"
                                />
                            ))}

                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-200/50 to-transparent" />
                        </motion.div>
                        
                        <div className="absolute -z-10 -bottom-8 -left-8 w-64 h-64 bg-[#6FE844]/10 rounded-full blur-[80px]" />
                    </div>

                    {/* Contenido de Stats */}
                    <div className="flex-1 order-1 lg:order-2">
                        <h2 className="text-4xl md:text-5xl font-bold text-[#59595B] mb-8 font-montserrat">
                            Información estratégica en <span className="text-[#6FE844]">tiempo real</span>
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {statsConfig.map((stat, i) => (
                                <motion.div 
                                    key={i} 
                                    className="flex items-start gap-4 group cursor-default"
                                    whileHover={{ x: 10 }}
                                >
                                    {/* Icono con Inversión de Color en Hover */}
                                    <div 
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 border border-[#6FE844]/20 bg-white group-hover:bg-[#6FE844] group-hover:border-transparent group-hover:shadow-lg"
                                        style={{ color: lodoGreen }}
                                    >
                                        <stat.icon className="w-7 h-7 transition-colors duration-300 group-hover:text-white" />
                                    </div>

                                    <div>
                                        <div className="text-3xl font-bold text-[#59595B] mb-1">
                                            {loading ? (
                                                <div className="h-8 w-16 bg-zinc-200 animate-pulse rounded-lg" />
                                            ) : (
                                                <span className="tabular-nums font-montserrat">
                                                    +<AnimatedCounter value={stat.value} />
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-zinc-400 font-black uppercase tracking-[0.2em]">{stat.label}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default React.memo(Stats);