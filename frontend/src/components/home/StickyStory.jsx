import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, SlidersHorizontal, Map as MapIcon, Link as LinkIcon } from 'lucide-react';

const steps = [
    {
        title: "Descubrí",
        description: "Navegá por el mapa dinámico y visualizá cientos de organizaciones categorizadas por sector, etapa y ubicación.",
        icon: Search,
    },
    {
        title: "Filtrá",
        description: "Utilizá nuestras herramientas avanzadas para encontrar exactamente lo que buscás en el ecosistema.",
        icon: SlidersHorizontal,
    },
    {
        title: "Compará",
        description: "Analizá el perfil detallado de cada organización, sus hitos y su impacto en la región.",
        icon: MapIcon,
    },
    {
        title: "Conectá",
        description: "LODO facilita el networking. Ponete en contacto directo con los actores clave del sector.",
        icon: LinkIcon,
    }
];

const StepContent = ({ step, index, total, progress }) => {
    const start = index / total;
    const end = (index + 1) / total;
    
    // Optimizamos las curvas de salida y entrada para que no haya saltos
    const opacity = useTransform(progress, [start, start + 0.1, end - 0.1, end], [0, 1, 1, 0]);
    const y = useTransform(progress, [start, start + 0.1, end - 0.1, end], [30, 0, 0, -30]);

    return (
        <motion.div
            style={{ opacity, y, willChange: "transform, opacity" }}
            className="absolute inset-0 flex flex-col justify-center"
        >
            <div className="w-16 h-16 rounded-2xl bg-[#6fea44]/10 border border-[#6fea44]/30 flex items-center justify-center mb-8 shadow-lg">
                <step.icon className="w-8 h-8 text-[#6fea44]" />
            </div>
            <h2 className="text-5xl md:text-7xl font-bold text-[#58595b] dark:text-white mb-6 uppercase tracking-tighter font-montserrat">
                {step.title}
            </h2>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
                {step.description}
            </p>
        </motion.div>
    );
};

const StickyStory = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        <section id="how-it-works" ref={containerRef} className="relative h-[400vh] bg-white dark:bg-zinc-950 transition-colors duration-500">
            <div className="sticky top-0 flex h-screen items-center overflow-hidden px-6">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left Side: Content */}
                    <div className="relative h-96">
                        {steps.map((step, i) => (
                            <StepContent 
                                key={i} 
                                step={step} 
                                index={i} 
                                total={steps.length} 
                                progress={scrollYProgress} 
                            />
                        ))}
                    </div>

                    {/* Right Side: Visual Progress (Optimizado) */}
                    <div className="hidden lg:flex justify-center items-center">
                        <div className="relative w-80 h-[500px]">
                            {/* Linea de progreso de fondo */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-200 dark:bg-white/10 -translate-x-1/2" />
                            
                            {/* Linea de progreso activa (Verde Lodo) */}
                            <motion.div
                                style={{ scaleY: scrollYProgress, originY: 0 }}
                                className="absolute left-1/2 top-0 bottom-0 w-1 bg-[#6fea44] -translate-x-1/2 shadow-[0_0_15px_rgba(111,234,68,0.5)] z-10"
                            />

                            {/* Indicadores de pasos */}
                            <div className="h-full flex flex-col justify-between py-10 relative z-20">
                                {steps.map((_, i) => {
                                    const stepStart = i / steps.length;
                                    // eslint-disable-next-line react-hooks/rules-of-hooks
                                    const dotScale = useTransform(scrollYProgress, 
                                        [stepStart - 0.1, stepStart, stepStart + 0.1], 
                                        [1, 1.8, 1]
                                    );
                                    // eslint-disable-next-line react-hooks/rules-of-hooks
                                    const dotColor = useTransform(scrollYProgress,
                                        [stepStart - 0.1, stepStart, stepStart + 0.1],
                                        ["#d4d4d8", "#6fea44", "#d4d4d8"]
                                    );

                                    return (
                                        <motion.div
                                            key={i}
                                            style={{ scale: dotScale, backgroundColor: dotColor }}
                                            className="w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 self-center shadow-md"
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default React.memo(StickyStory);