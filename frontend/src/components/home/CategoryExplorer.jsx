import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Leaf, Utensils, Cloud, Cpu, FlaskConical, BarChart as ChartBar, MapPin } from 'lucide-react';

const categories = [
    {
        id: 'AgTech',
        label: 'AgTech',
        icon: Leaf,
        description: 'Tecnología aplicada a la agricultura para mejorar la eficiencia y sostenibilidad del campo.',
        color: '#6fea44',
        query: 'AgTech'
    },
    {
        id: 'FoodTech',
        label: 'FoodTech',
        icon: Utensils,
        description: 'Innovación en la producción, distribución y consumo de alimentos.',
        color: '#6fea44',
        query: 'FoodTech'
    },
    {
        id: 'ClimateTech',
        label: 'ClimateTech',
        icon: Cloud,
        description: 'Soluciones tecnológicas para mitigar el impacto ambiental y combatir el cambio climático.',
        color: '#10b981',
        query: 'ClimateTech'
    },
    {
        id: 'Industry40',
        label: 'Industria 4.0',
        icon: Cpu,
        description: 'Digitalización y automatización de procesos industriales con IoT e IA.',
        color: '#59595B',
        query: 'IA / IoT'
    },
    {
        id: 'Biotech',
        label: 'Biotech',
        icon: FlaskConical,
        description: 'Aplicación de la biología en el desarrollo de productos y procesos innovadores.',
        color: '#6fea44',
        query: 'Biotech'
    },
    {
        id: 'Marketplace',
        label: 'Fintech / Market',
        icon: ChartBar,
        description: 'Soluciones financieras y plataformas de comercio para el ecosistema productivo.',
        color: '#6fea44',
        query: 'E-commerce'
    }
];

const CategoryExplorer = () => {
    const [selected, setSelected] = useState(categories[0]);
    const navigate = useNavigate();
    const lodoDark = "#59595B"; 
    const lodoLight = "#f4f4f5"; // El gris clarito para las cards

    return (
        <section className="py-24 px-6 transition-colors duration-500 overflow-hidden" style={{ backgroundColor: lodoDark }}>
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-montserrat tracking-tight">
                        Explorá por <span className="text-[#6fea44]">verticales</span>
                    </h2>
                    <p className="text-white/60 text-lg font-medium">
                        Filtrá el ecosistema según tu interés y descubrí oportunidades específicas.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Category Tiles en Gris Clarito */}
                    <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {categories.map((cat) => {
                            const isSelected = selected.id === cat.id;
                            return (
                                <motion.button
                                    key={cat.id}
                                    onClick={() => setSelected(cat)}
                                    whileHover={{ y: -5 }}
                                    whileTap={{ scale: 0.97 }}
                                    className={`relative p-7 rounded-[2rem] border-2 transition-all duration-500 text-left group overflow-hidden ${
                                        isSelected
                                            ? 'bg-[#6fea44] border-transparent shadow-xl'
                                            : 'bg-[#f4f4f5] border-transparent hover:bg-[#6fea44]'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-500 ${
                                        isSelected ? 'bg-white/20' : 'bg-black/5 group-hover:bg-white/20'
                                    }`}>
                                        <cat.icon className={`w-6 h-6 transition-colors duration-500 ${
                                            isSelected ? 'text-white' : 'text-[#59595B] group-hover:text-white'
                                        }`} />
                                    </div>
                                    <span className={`font-bold text-xs uppercase tracking-wider transition-colors duration-500 ${
                                        isSelected ? 'text-white' : 'text-[#59595B] group-hover:text-white'
                                    }`}>
                                        {cat.label}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Detail Card en Gris Clarito */}
                    <div className="lg:col-span-5">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selected.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="p-10 rounded-[2.5rem] bg-[#f4f4f5] shadow-2xl relative z-10"
                            >
                                {/* Badge corregido */}
                                <div className="inline-block px-3 py-1 rounded-lg bg-[#59595B] text-[10px] font-bold text-[#6fea44] uppercase tracking-widest mb-6">
                                    Foco Estratégico
                                </div>
                                
                                <h3 className="text-3xl font-bold text-[#59595B] mb-4 font-montserrat">{selected.label}</h3>
                                <p className="text-[#59595B]/70 text-lg leading-relaxed mb-10 font-medium">
                                    {selected.description}
                                </p>

                                {/* Botón Espejo */}
                                <button
                                    onClick={() => navigate(`/map?filter=${selected.query}`)}
                                    className="w-full py-4 rounded-xl bg-[#6fea44] text-[#59595B] font-bold uppercase text-sm tracking-widest flex items-center justify-center border-2 border-[#6fea44] hover:bg-transparent hover:text-[#59595B] transition-all duration-300 group"
                                >
                                    Ver en el mapa
                                    <MapPin className="ml-2 w-4 h-4 transition-transform group-hover:translate-y-[-2px]" />
                                </button>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default React.memo(CategoryExplorer);