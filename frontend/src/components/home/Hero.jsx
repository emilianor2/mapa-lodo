import React from 'react';
import { motion } from 'framer-motion';
import { Map, ArrowRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
    const navigate = useNavigate();

    const scrollToNext = () => {
        // Buscamos la siguiente sección (asegúrate que el siguiente componente tenga id="stats")
        const nextSection = document.getElementById('stats');
        if (nextSection) {
            nextSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Fallback: si no hay id, scrolleamos una pantalla completa
            window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        }
    };

    return (
        <section className="relative min-h-[85vh] flex flex-col items-center justify-start px-6 overflow-hidden pt-32 md:pt-40 bg-zinc-100 dark:bg-zinc-950 transition-colors duration-500">
            
            {/* Background Glow */}
            <div className="absolute inset-0 flex items-center justify-center -z-0 opacity-30 dark:opacity-20 pointer-events-none">
                <div className="relative w-full max-w-[1000px] aspect-square">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,#6fea44_0%,transparent_70%)] blur-[120px]"
                    />
                </div>
            </div>

            {/* Main Content Container - pb-32 para evitar colisión con el indicador en móviles */}
            <div className="relative z-10 max-w-5xl mx-auto text-center md:mt-4 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    {/* Badge Institucional */}
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#6fea44]/30 bg-[#6fea44]/10 text-[#58595b] dark:text-[#6fea44] text-sm font-medium mb-8 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-[#6fea44] animate-pulse mr-2" />
                        El ecosistema AgriFoodTech en un solo lugar
                    </span>

                    {/* Título */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#58595b] dark:text-white mb-6 font-montserrat leading-[1.1]">
                        LODO: Hub de <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6fea44] to-[#58595b] dark:to-emerald-400">
                            Innovación AgriFoodTech
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Visualizá, conectá y escalá. El mapa dinámico que reúne a los principales actores del sector agroindustrial y tecnológico de la región.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/map')}
                            className="group relative px-8 py-4 bg-[#6fea44] text-[#58595b] hover:bg-[#58595b] hover:text-[#6fea44] rounded-2xl font-bold flex items-center transition-all duration-300 shadow-lg shadow-[#6fea44]/20"
                        >
                            <Map className="w-5 h-5 mr-3" />
                            Explorar el mapa
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator Interactivo - Corregido y con Z-index alto */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer group"
                onClick={scrollToNext}
            >
                <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black group-hover:text-[#6fea44] transition-colors">
                    Descubrir
                </span>
                
                <div className="relative flex items-center justify-center">
                    {/* Efecto de onda (Ping) */}
                    <div className="absolute inset-0 rounded-full bg-[#6fea44]/20 animate-ping group-hover:bg-[#6fea44]/40" />
                    
                    <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="relative bg-white dark:bg-zinc-900 p-2 rounded-full shadow-md border border-zinc-200 dark:border-white/5 group-hover:border-[#6fea44] transition-colors"
                    >
                        <ChevronDown className="w-5 h-5 text-[#6fea44]" />
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
};

export default React.memo(Hero);